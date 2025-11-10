// app/api/docs/openapi.yaml/route.ts
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "docs", "openapi.yaml");
    const fileContent = await readFile(filePath, "utf8");

    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": "application/yaml",
        "Cache-Control": "public, max-age=3600", // Cache por 1 hora
      },
    });
  } catch (error) {
    console.error("Erro ao carregar OpenAPI spec:", error);
    return NextResponse.json(
      { error: "OpenAPI specification not found" },
      { status: 404 }
    );
  }
}
