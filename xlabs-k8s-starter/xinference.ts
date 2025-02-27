import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import * as ejs from "ejs";

let config = new pulumi.Config();

const replaceVars = {
    hostname: "xinference." + config.require("hostnameSuffix"),
}
const valueYamlAsset = new pulumi.asset.StringAsset(ejs.renderFile("./xinference.values.yaml", replaceVars));

const xinferenceRelease = new kubernetes.helm.v3.Release("xinference", {
    name: "xinference",
    chart: "xinference",
    version: "0.0.2-v0.14.4",
    namespace: "xinference",
    createNamespace: true,
    timeout: 300,
    maxHistory: 10,
    repositoryOpts: {
        repo: "https://xorbitsai.github.io/xinference-helm-charts",
    },
    valueYamlFiles: [valueYamlAsset]
});

export const xinferenceReleaseStatus = xinferenceRelease.status;

