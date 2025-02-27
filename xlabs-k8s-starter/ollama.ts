import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import * as ejs from "ejs";

let config = new pulumi.Config();

const replaceVars = {
    hostname: "ollama." + config.require("hostnameSuffix"),
}
const valueYamlAsset= new pulumi.asset.StringAsset(ejs.renderFile("./ollama.values.yaml", replaceVars));

const ollamaRelease = new kubernetes.helm.v3.Release("ollama", {
    name: "ollama",
    chart: "ollama",
    version: "1.7.0",
    namespace: "ollama",
    createNamespace: true,
    timeout: 300,
    maxHistory: 10,
    repositoryOpts: {
        repo: "https://otwld.github.io/ollama-helm",
    },
    valueYamlFiles: [valueYamlAsset]
});

export const ollamaReleaseStatus = ollamaRelease.status;

