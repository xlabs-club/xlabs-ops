import * as kubernetes from "@pulumi/kubernetes";
import { FileAsset } from "@pulumi/pulumi/asset";

const kafkaRelease = new kubernetes.helm.v3.Release("kafka", {
    name: "kafka",
    chart: "oci://registry-1.docker.io/bitnamicharts/kafka",
    version: "31.1.0",
    namespace: "kafka",
    createNamespace: true,
    timeout: 300,
    maxHistory: 10,
    valueYamlFiles: [new FileAsset("./kafka.values.yaml")],
});

export const kafkaReleaseStatus = kafkaRelease.status;
