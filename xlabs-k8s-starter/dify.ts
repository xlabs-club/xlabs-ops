import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import * as ejs from "ejs";

let config = new pulumi.Config();

const valueYamlAsset = pulumi.all(
    [
        config.requireSecret("globalPostgresPassword"),
        config.requireSecret("redisPassword")
    ])
    .apply(([postgrePwd, redisPassword]) => {
        const replaceVars = {
            hostname: "dify." + config.require("hostnameSuffix"),
            keycloakBaseUrl: "https://" + "iam." + config.require("hostnameSuffix"),
            postgresPassword: postgrePwd,
            redisPassword: redisPassword
        }
        return new pulumi.asset.StringAsset(ejs.renderFile("./dify.values.yaml", replaceVars));
    });


const difyRelease = new kubernetes.helm.v3.Release("dify", {
    name: "dify",
    chart: "dify",
    version: "0.23.0-rc4",
    namespace: "dify",
    createNamespace: true,
    timeout: 300,
    maxHistory: 10,
    repositoryOpts: {
        repo: "https://borispolonsky.github.io/dify-helm",
    },
    valueYamlFiles: [valueYamlAsset]
});

export const difyReleaseStatus = difyRelease.status;

