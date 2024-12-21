// Homepage: https://github.com/DependencyTrack/hyades
import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import * as ejs from "ejs";

let config = new pulumi.Config();

const replaceVars = {
    hostname: "hyades." + config.require("hostnameSuffix"),
}
const rendered = ejs.renderFile("./hyades.values.yaml", replaceVars);
const valueYamlAsset= new pulumi.asset.StringAsset(rendered);

const hyadesRelease = new kubernetes.helm.v3.Release("hyades", {
    name: "hyades",
    chart: "hyades",
    version: "0.10.0",
    namespace: "hyades",
    createNamespace: true,
    timeout: 300,
    maxHistory: 10,
    repositoryOpts: {
        repo: "https://dependencytrack.github.io/helm-charts",
    },
    valueYamlFiles: [valueYamlAsset]
});

export const hyadesReleaseStatus = hyadesRelease.status;
