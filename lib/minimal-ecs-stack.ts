// 5. This is the final version of the sample project. It adds a separate stack for
// the ECR repository, so that the custom image can be pushed there and redeployed
// without involving CloudFormation.
//
// Deployment steps:
// 1. Deploy the ECR 'RepositoryStack' stack.
// 2. Build the Docker image and push it to the ECR repository (instructions in Dockerfile)
// 3. Deploy the ECS 'MinimalEcsStack' stack.
// Done!

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as apigw2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpAlbIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

export const PREFIX = "my-ecs";

export class MinimalEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, ecrRepository: ecr.Repository, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // container image + ecs task + ecs

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
        image: ecs.ContainerImage.fromEcrRepository(ecrRepository),
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

    // const repository = new ecr.Repository(this, "Repository", { repositoryName: `${PREFIX}-repository` });

    // if repository has images, then deploy a service
  }
}

export class RepositoryStack extends cdk.Stack {
  repository: ecr.Repository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repository = new ecr.Repository(this, "Repository", { repositoryName: `${PREFIX}-repository` });
    this.repository = repository;

    // const repositoryArn = new cdk.CfnOutput(this, "RepositoryArn", {
    //   key: "repositoryArn",
    //   value: repository.repositoryArn
    // })
  }
}
