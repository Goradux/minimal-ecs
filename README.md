# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template



# Steps

1. npm install -g aws-cdk
2. create folder called "minimal-ecs"
3. cdk init app --language typescript
4. rename stack
5. add code
6. Test image locally: docker pull public.ecr.aws/ecs-sample-image/amazon-ecs-sample:latest
7. Checkpoint: minimal-ecs-stack-ecs-only.ts
8. make ALB private and add API Gateway stuff. Checkpoint: minimal-ecs-stack-ecs-gateway.ts
9. Add autoscaling policies. Checkpoints: minimal-ecs-stack-ecs-gateway-scaling.ts
10. create a new package in container: `npm init -y`, `npx tsc --init`, `Dockerfile`
11. 