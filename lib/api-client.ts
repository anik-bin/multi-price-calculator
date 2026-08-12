export class ApiError extends Error {
    status: number;
    details: { field: string; message: string }[];

    constructor(status: number, message: string, details: { field: string; message: string }[] = []) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(path, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...init?.headers,
        },
    });

    // 204/empty bodies still need to resolve to something
    const body = await res.json().catch(() => null);

    if (!res.ok) {
        throw new ApiError(res.status, body?.error ?? "Something went wrong", body?.details ?? []);
    }

    return body as T;
}

export const api = {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, data?: unknown) =>
        request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined }),
    patch: <T>(path: string, data: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// pulls the first message for a given field out of an ApiError's details,
// for rendering inline under a form input
export function fieldError(err: unknown, field: string): string | undefined {
    if (err instanceof ApiError) {
        return err.details.find((d) => d.field === field)?.message;
    }
    return undefined;
}
