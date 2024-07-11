// 4. This version replaces the generic container image reference with a local one.
// Refer to `~/container/Dockerfile` for more info. This stack pushes the image to
// the automatically created container repository.

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as apigw2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpAlbIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

export const PREFIX = "alas-ecs";

export class MinimalEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // deploy a cluster into a vpc
    const vpc = new ec2.Vpc(this, "Vpc", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 2, // 1 public + 1 private subnets
      vpcName: `${PREFIX}-vpc`,
      restrictDefaultSecurityGroup: false,
    });

    const cluster: ecs.Cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
      clusterName: `${PREFIX}-cluster`
    })

    const service = new ApplicationLoadBalancedFargateService(this, "Service", {
      serviceName: `${PREFIX}-service`,
      loadBalancerName: `${PREFIX}-private-alb`,
      cluster,
      memoryLimitMiB: 1024,
      cpu: 512, // 0.25 vCPU
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset("./container/"), // relative to CDK entry point
        environment: {
          ENV_VAR_1: "value1",
          ENV_VAR_2: "value2",
        },
        containerPort: 80,
      },
      desiredCount: 2,
      publicLoadBalancer: false,
      // runtimePlatform: ... // or specify ARM if you dont want to change the Dockerfile
    })

    service.targetGroup.configureHealthCheck({
      path: "/"
    });

    const scaling = service.service.autoScaleTaskCount({ maxCapacity: 5, minCapacity: 1 });
    scaling.scaleOnCpuUtilization("CpuScaling", { targetUtilizationPercent: 70 }); // default cooldown of 5 min
    scaling.scaleOnMemoryUtilization("RamScaling", { targetUtilizationPercent: 70 }); // default cooldown of 5 min

    const httpApi = new apigw2.HttpApi(this, "HttpApi", { apiName: `${PREFIX}-api` });

    httpApi.addRoutes({
      path: "/",
      methods: [apigw2.HttpMethod.GET],
      integration: new HttpAlbIntegration("AlbIntegration", service.listener)
    })
    // note: non-sticky sessions!
  }
}

// 1. create the container files
// 2. deploy the stack