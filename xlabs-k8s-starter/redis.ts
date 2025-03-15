import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import * as ejs from "ejs";

let config = new pulumi.Config();

// Deploy redis using the Helm chart
const valueYamlAsset = pulumi.all(
    [
        config.requireSecret("redisPassword")
    ])
    .apply(([redisPassword]) => {
        const replaceVars = {
            redisPassword: redisPassword
        }
        return new pulumi.asset.StringAsset(ejs.renderFile("./redis.values.yaml", replaceVars));
    });

const redisRelease = new kubernetes.helm.v3.Release("redis", {
    name: "redis",
    chart: "oci://registry-1.docker.io/bitnamicharts/redis",
    version: "20.11.3",
    namespace: "redis",
    createNamespace: true,
    timeout: 600,
    maxHistory: 10,
    valueYamlFiles: [valueYamlAsset]
});


export const redisReleaseStatus = redisRelease.status;
