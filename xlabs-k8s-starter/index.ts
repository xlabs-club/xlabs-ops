// export * 即执行任务，又能 export，可以进行 pulumi stack output
export * from "./cert-manager";
import "./keycloak";
import "./oauth2-proxy";
import "./backstage";
import "./argo-workflows";
// import "./argo-cd";
import "./coredns-custom";
import "./cdn";