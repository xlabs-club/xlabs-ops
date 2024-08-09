import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

let config = new pulumi.Config();

// Deploy backstage using the Helm chart
const backstageRelease = new kubernetes.helm.v3.Release("backstage", {
    name: "backstage",
    chart: "oci://ghcr.io/backstage/charts/backstage",
    version: "1.9.5",
    namespace: "backstage",
    createNamespace: true,
    timeout: 600,
    values: {
        backstage: {
            image: {
                tag: "1.29.2",
                pullPolicy: "IfNotPresent"
            },
            appConfig: {
                app: {
                    title: "IDP",
                    baseUrl: "https://" + "backstage." + config.require("hostnameSuffix"),
                },
                backend: {
                    auth: {
                        dangerouslyDisableDefaultAuthPolicy: true
                    },
                    baseUrl: "https://" + "backstage." + config.require("hostnameSuffix"),
                },
                organization: {
                    name: "XLabs"
                },
                techdocs: {
                    builder: "local"
                },
                auth: {
                    environment: "development",
                    session: {
                        // must define a session secret (see above) since the oidc provider requires session support.
                        secret: "a-secret-for-sessions"
                    },
                    providers: {
                        oidc: {
                            development: {
                                metadataUrl: "https://" + "keyclaok." + config.require("hostnameSuffix") + "/realms/devops",
                                clientId: "backstage",
                                clientSecret: "EBvO09iPK6x2MSrQFcoykGNewUAHsnAv",
                                prompt: "login",
                            }
                        }
                    }
                },
            }
        },
        ingress: {
            enabled: true,
            tls: {
                enabled: true,
                secretName: "backstage." + config.require("hostnameSuffix") + "-tls",
            },
            host: "backstage." + config.require("hostnameSuffix"),
            annotations: {
                "cert-manager.io/cluster-issuer": config.require("clusterIssuer")
            },
        },
        postgresql: {
            enabled: true,
            auth: {
                postgresPassword: config.requireSecret("globalPostgresPassword"),
                username: "backstage",
                password: config.requireSecret("globalPostgresPassword"),
                database: "backstage",
                secretKeys: {
                    adminPasswordKey: "postgres-password",
                    userPasswordKey: "password"
                }
            }
        }
    },

});


export const backstageReleaseStatus = backstageRelease.status;
