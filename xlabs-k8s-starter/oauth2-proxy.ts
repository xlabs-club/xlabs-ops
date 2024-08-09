import * as pulumi from "@pulumi/pulumi";
import * as kubernetes from "@pulumi/kubernetes";

let config = new pulumi.Config();

// Deploy oauth2-proxy using the Helm chart
const oauth2ProxyRelease = new kubernetes.helm.v3.Release("oauth2-proxy", {
    name: "oauth2-proxy",
    chart: "oci://registry-1.docker.io/bitnamicharts/oauth2-proxy",
    version: "5.3.12",
    namespace: "oauth2-proxy",
    createNamespace: true,
    timeout: 600,
    values: {
        networkPolicy: {
            enabled: false,
        },
        ingress: {
            enabled: true,
            tls: true,
            certManager: true,
            hostname: "oauth2-proxy." + config.require("hostnameSuffix"),
            annotations: {
                "cert-manager.io/cluster-issuer": config.require("clusterIssuer")
            },
        },
        hostAliases: [
            { "ip": "172.29.1.43", "hostnames": ["keycloak." + config.require("hostnameSuffix")] }
        ],
        redis: {
            enabled: false,
        },
        extraArgs: [
            "--provider=keycloak-oidc",
            "--provider-display-name=Keycloak",
            "--insecure-oidc-skip-issuer-verification",
            "--ssl-insecure-skip-verify",
            "--ssl-upstream-insecure-skip-verify"
        ],
        configuration: {
            clientID: "oauth2-proxy",
            clientSecret: "sRhyk4GhhHMCbyL1Dy4ZYL3zh1yD0GEY",
            cookieSecret: "ZP7ecpvskVf2XkPfWzYT1ta6E-K0nJT_hHHJQKmHHuM=",
            oidcIssuerUrl: "https://" + "keycloak." + config.require("hostnameSuffix") + "/realms/devops",
            redirectUrl: "https://" + "oauth2-proxy." + config.require("hostnameSuffix") + "/oauth2/callback",
            whiteList: "*",
        }
    },

});


export const oauth2ProxyReleaseStatus = oauth2ProxyRelease.status;
