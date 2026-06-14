"use client";

/** Thin client-side fetch wrapper that unwraps our { ok, data, error } envelope. */
export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  status: number;
}

export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const status = res.status;
    let payload: { ok?: boolean; data?: T; error?: string } = {};
    try {
      payload = await res.json();
    } catch {
      // non-JSON response
    }
    return {
      ok: res.ok && payload.ok !== false,
      data: payload.data,
      error: payload.error,
      status,
    };
  } catch {
    return { ok: false, error: "Tidak bisa terhubung ke server. Periksa koneksi.", status: 0 };
  }
}
