"use client";

import {
  useEffect,
  useRef,
} from "react";

import type { Database } from "@/supabase/types/database.types";

import {
  loginAction,
} from "@/app/actions/auth.actions";

type DeviceType =
  Database["public"]["Enums"]["device_type"];

const DEVICE_STORAGE_KEY =
  "dokter_ambis_device_identifier";

function createDeviceIdentifier(): string {
  const existing =
    window.localStorage.getItem(
      DEVICE_STORAGE_KEY,
    );

  if (existing) {
    return existing;
  }

  const identifier =
    window.crypto.randomUUID();

  window.localStorage.setItem(
    DEVICE_STORAGE_KEY,
    identifier,
  );

  return identifier;
}

function detectDeviceType(): DeviceType {
  const userAgent =
    navigator.userAgent.toLowerCase();

  if (
    /ipad|tablet/.test(userAgent) ||
    (
      /android/.test(userAgent) &&
      !/mobile/.test(userAgent)
    )
  ) {
    return "tablet";
  }

  if (
    /iphone|ipod|mobile|android/.test(
      userAgent,
    )
  ) {
    return "mobile";
  }

  return "laptop";
}

function detectBrowser(): string {
  const userAgent =
    navigator.userAgent;

  if (userAgent.includes("Edg/")) {
    return "Edge";
  }

  if (
    userAgent.includes("Chrome/") &&
    !userAgent.includes("Edg/")
  ) {
    return "Chrome";
  }

  if (
    userAgent.includes("Safari/") &&
    !userAgent.includes("Chrome/")
  ) {
    return "Safari";
  }

  if (userAgent.includes("Firefox/")) {
    return "Firefox";
  }

  return "Browser";
}

function detectOperatingSystem(): string {
  const userAgent =
    navigator.userAgent;

  if (/Windows/i.test(userAgent)) {
    return "Windows";
  }

  if (/Android/i.test(userAgent)) {
    return "Android";
  }

  if (
    /iPhone|iPad|iPod/i.test(
      userAgent,
    )
  ) {
    return "iOS";
  }

  if (/Macintosh|Mac OS/i.test(userAgent)) {
    return "macOS";
  }

  if (/Linux/i.test(userAgent)) {
    return "Linux";
  }

  return "Perangkat";
}

export default function LoginForm() {
  const deviceIdentifierRef =
    useRef<HTMLInputElement>(null);

  const deviceNameRef =
    useRef<HTMLInputElement>(null);

  const deviceTypeRef =
    useRef<HTMLInputElement>(null);

  const submitButtonRef =
    useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (deviceIdentifierRef.current) {
      deviceIdentifierRef.current.value =
        createDeviceIdentifier();
    }

    if (deviceNameRef.current) {
      deviceNameRef.current.value =
        `${detectBrowser()} di ${detectOperatingSystem()}`;
    }

    if (deviceTypeRef.current) {
      deviceTypeRef.current.value =
        detectDeviceType();
    }

    if (submitButtonRef.current) {
      submitButtonRef.current.disabled = false;
    }
  }, []);

  return (
    <form
      action={loginAction}
      className="space-y-5"
    >
      <input
        ref={deviceIdentifierRef}
        type="hidden"
        name="deviceIdentifier"
      />

      <input
        ref={deviceNameRef}
        type="hidden"
        name="deviceName"
      />

      <input
        ref={deviceTypeRef}
        type="hidden"
        name="deviceType"
      />

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Email
        </label>

        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="nama@email.com"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Masukkan password"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <button
        ref={submitButtonRef}
        type="submit"
        disabled
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Masuk
      </button>
    </form>
  );
}