// 2. This version of the stack places the ECS service (and the ALB) into the private subnet of the VPC,
// making it publicly unavailable. It also adds an API Gateway in front of the ALB for public access.

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
    // this includes 2 private and 2 public subnets by default. Public subnets have NAT gateways associated with them ($$$)
    const vpc = new ec2.Vpc(this, "Vpc", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 2, // each has 1 public + 1 private subnets
      vpcName: `${PREFIX}-vpc`,
      restrictDefaultSecurityGroup: false
      // https://stackoverflow.com/questions/77831440/is-there-a-way-to-connect-alb-to-an-api-gateway-privately
    });

    const cluster: ecs.Cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
      clusterName: `${PREFIX}-cluster`
    })

    const service = new ApplicationLoadBalancedFargateService(this, "Service", {
      serviceName: `${PREFIX}-service`,
      loadBalancerName: `${PREFIX}-private-alb`,
      cluster,
      memoryLimitMiB: 512,
      cpu: 256, // 0.25 vCPU
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry("public.ecr.aws/ecs-sample-image/amazon-ecs-sample:latest"),
        environment: {
          ENV_VAR_1: "value1",
          ENV_VAR_2: "value2",
        },
        containerPort: 80
      },
      desiredCount: 2,
      publicLoadBalancer: false,
    })

    service.targetGroup.configureHealthCheck({
      path: "/"
    })

    const httpApi = new apigw2.HttpApi(this, "HttpApi", { apiName: `${PREFIX}-api` });

    httpApi.addRoutes({
      path: "/",
      methods: [apigw2.HttpMethod.GET],
      integration: new HttpAlbIntegration("AlbIntegration", service.listener)
    })
  }
}

// todo next: add a route 53 domain if you want to!