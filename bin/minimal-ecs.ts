#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MinimalEcsStack, RepositoryStack, PREFIX } from '../lib/minimal-ecs-stack';

const account = "<INSERT_YOUR_OWN>";
const region = "eu-west-1";
const repoStackName = `${PREFIX}-repo`;
const ecsStackName = `${PREFIX}-stack`;

const app = new cdk.App();

const repoStack = new RepositoryStack(app, repoStackName, {
  env: { account, region },
})

const stack = new MinimalEcsStack(app, ecsStackName, repoStack.repository, {
  env: { account, region },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

cdk.Tags.of(stack).add("stack", ecsStackName);
cdk.Tags.of(repoStack).add("stack", repoStackName);
