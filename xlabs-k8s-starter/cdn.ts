import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";
import * as ejs from "ejs";

let config = new pulumi.Config();

const replaceVars = {
    hostname: "cdn." + config.require("hostnameSuffix"),
}
const rendered = ejs.renderFile("./cdn.values.yaml", replaceVars);
const valueYamlAsset= new pulumi.asset.StringAsset(rendered);

const cdnRelease = new kubernetes.helm.v3.Release("cdn", {
    name: "cdn",
    chart: "oci://registry-1.docker.io/bitnamicharts/nginx",
    version: "18.2.4",
    namespace: "cdn",
    createNamespace: true,
    timeout: 300,
    valueYamlFiles: [valueYamlAsset]
});

export const cdnReleaseStatus = cdnRelease.status;
