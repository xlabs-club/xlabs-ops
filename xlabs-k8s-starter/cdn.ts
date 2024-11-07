import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

let config = new pulumi.Config();

const cdnRelease = new kubernetes.helm.v3.Release("cdn", {
    name: "cdn",
    chart: "oci://registry-1.docker.io/bitnamicharts/nginx",
    version: "18.2.4",
    namespace: "cdn",
    createNamespace: true,
    timeout: 300,
    values: {
        image: {
            repository: "nxest/hamster",
            tag: "0.0.1"
        },
        resourcesPreset: "small",
        tls: {
            enabled: false,
        },
        service: {
            type: "ClusterIP",
        },
        ingress: {
            enabled: true,
            tls: true,
            hostname: "cdn." + config.require("hostnameSuffix"),
            annotations: {
                "cert-manager.io/cluster-issuer": config.require("clusterIssuer")
            },
        },
    },
});

export const cdnReleaseStatus = cdnRelease.status;
