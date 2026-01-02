const TOKEN_MAP = [
  "scene",
  "characters",
  "action",
  "camera",
  "constraints",
] as const;

export type TemplateInput = Record<(typeof TOKEN_MAP)[number], string> &
  Record<string, string>;

export function renderBasePrompt(basePrompt: string, input: TemplateInput) {
  return TOKEN_MAP.reduce((result, key) => {
    const value = input[key] ?? "";
    return result.replaceAll(`{{${key}}}`, value);
  }, basePrompt);
}

export function formatForPlatform(
  platform: "sora" | "veo",
  prompt: string,
  input: TemplateInput
) {
  if (platform === "veo") {
    const timeline = input.timeline ? `Timeline: ${input.timeline}` : "";
    const constraints = input.constraints
      ? `Constraints: ${input.constraints}`
      : "";
    return [
      "Veo Cinematic Spec",
      prompt,
      timeline,
      constraints,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return prompt;
}
