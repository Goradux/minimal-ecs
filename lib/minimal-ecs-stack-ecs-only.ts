// 1. The initial version. Only has an ECS service with Application Load Balancer (ALB)
// that is deployed in a VPC. The ALB endpoint is publicly exposed.

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export const PREFIX = "alas-ecs";

export class MinimalEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // deploy a cluster into a vpc
    const vpc = new ec2.Vpc(this, "Vpc", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 2, // each will have 1 public + 1 private subnets
      vpcName: `${PREFIX}-vpc`
    });

    const cluster: ecs.Cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
      clusterName: `${PREFIX}-cluster`
    })

    const service = new ApplicationLoadBalancedFargateService(this, "Service", {
      serviceName: `${PREFIX}-service`,
      loadBalancerName: `${PREFIX}-alb`,
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
    })

    service.targetGroup.configureHealthCheck({
      path: "/"
    })
  }
}
