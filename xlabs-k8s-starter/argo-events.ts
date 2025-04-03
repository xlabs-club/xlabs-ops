import * as kubernetes from "@pulumi/kubernetes";
import { FileAsset } from "@pulumi/pulumi/asset";

const argoEventsRelease = new kubernetes.helm.v3.Release("argo-events", {
    name: "argo-events",
    chart: "argo-events",
    version: "2.4.14",
    namespace: "argo",
    createNamespace: true,
    timeout: 300,
    maxHistory: 10,
    repositoryOpts: {
        repo: "https://argoproj.github.io/argo-helm",
    },
    valueYamlFiles: [new FileAsset("./argo-events.values.yaml")],
});


const argoEventBus = new kubernetes.yaml.ConfigFile("argo-event-bus", {
    file: "argo-event-bus.yaml",
});

export const argoEventsReleaseStatus = argoEventsRelease.status;
export const argoEventBusStatus = argoEventBus.ready;
