import { describe, expect, it } from "vitest";
import { isIpLiteral, isPrivateAddress, isUnusablePattern, matchesPattern } from "../src/scope.js";

describe("isPrivateAddress", () => {
  it("knows the IPv4 ranges that are not reachable from outside", () => {
    for (const host of [
      "127.0.0.1",
      "10.1.2.3",
      "192.168.0.1",
      "172.16.0.1",
      "172.31.255.255",
      "169.254.1.1",
      "100.64.0.1",
      "0.0.0.0",
    ]) {
      expect(isPrivateAddress(host), host).toBe(true);
    }
  });

  it("leaves public IPv4 addresses alone", () => {
    for (const host of ["8.8.8.8", "172.32.0.1", "192.169.0.1", "100.128.0.1"]) {
      expect(isPrivateAddress(host), host).toBe(false);
    }
  });

  it("knows the IPv6 forms, bracketed or not", () => {
    for (const host of ["::1", "::", "fe80::1", "fc00::1", "fd12:3456::1", "[fd00::1]"]) {
      expect(isPrivateAddress(host), host).toBe(true);
    }
  });

  it("sees through an IPv4 address wearing an IPv6 coat", () => {
    expect(isPrivateAddress("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateAddress("::ffff:169.254.169.254")).toBe(true);
    expect(isPrivateAddress("::ffff:8.8.8.8")).toBe(false);
  });

  it("does not read a domain name as an address", () => {
    // fc00::/7 and fe80::/10 are address prefixes. A name that merely starts
    // with the same letters is an ordinary public domain.
    for (const host of [
      "fcbank.com",
      "fd-tech.de",
      "fdny.example.com",
      "fe80.example.com",
      "localhost.example.com",
      "example.com",
    ]) {
      expect(isPrivateAddress(host), host).toBe(false);
    }
  });

  it("still knows localhost itself", () => {
    expect(isPrivateAddress("localhost")).toBe(true);
  });
});

describe("isIpLiteral", () => {
  it("separates addresses from names", () => {
    expect(isIpLiteral("192.168.0.1")).toBe(true);
    expect(isIpLiteral("[fd00::1]")).toBe(true);
    expect(isIpLiteral("example.com")).toBe(false);
  });
});

describe("isUnusablePattern", () => {
  it("rejects patterns that name no reachable host", () => {
    for (const pattern of ["*", "", ".", "localhost"]) {
      expect(isUnusablePattern(pattern), pattern).toBe(true);
    }
    expect(isUnusablePattern("example.com")).toBe(false);
    expect(isUnusablePattern("*.example.com")).toBe(false);
  });
});

describe("matchesPattern", () => {
  it("covers the domain itself and anything under it", () => {
    expect(matchesPattern("*.example.com", "example.com")).toBe(true);
    expect(matchesPattern("*.example.com", "api.example.com")).toBe(true);
    expect(matchesPattern("*.example.com", "deep.api.example.com")).toBe(true);
  });

  it("does not match a domain that merely ends with the same letters", () => {
    expect(matchesPattern("*.example.com", "evilexample.com")).toBe(false);
    expect(matchesPattern("example.com", "evilexample.com")).toBe(false);
  });

  it("matches a path on whole segments only", () => {
    expect(matchesPattern("example.com/app", "example.com/app")).toBe(true);
    expect(matchesPattern("example.com/app", "example.com/app/inner")).toBe(true);
    expect(matchesPattern("example.com/app", "example.com/application")).toBe(false);
  });

  it("ignores scheme, port and a trailing dot", () => {
    expect(matchesPattern("example.com", "https://example.com:8443/")).toBe(true);
    expect(matchesPattern("example.com", "example.com.")).toBe(true);
  });
});
