export type TemplateInput = Record<string, string>;

export function renderBasePrompt(basePrompt: string, input: TemplateInput) {
  return basePrompt.replace(/{{\s*([\w-]+)\s*}}/g, (_, key: string) => {
    return input[key] ?? "";
  });
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
