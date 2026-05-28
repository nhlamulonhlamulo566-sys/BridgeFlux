'use server';
/**
 * @fileOverview An AI-powered diagnostic tool for TCP tunnel failures.
 *
 * - diagnoseTunnelFailure - A function that analyzes connection logs and local network status to diagnose tunnel failures and suggest fixes.
 * - TunnelFailureDiagnosticsInput - The input type for the diagnoseTunnelFailure function.
 * - TunnelFailureDiagnosticsOutput - The return type for the diagnoseTunnelFailure function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TunnelFailureDiagnosticsInputSchema = z.object({
  connectionLogs: z.string().describe('Detailed connection logs from the tunnel agent, including any error messages and timestamps.'),
  localNetworkStatus: z.string().describe('Output from local network diagnostic tools (e.g., ipconfig/ifconfig, netstat, firewall status, ping results to gateway/DNS, etc.)'),
});
export type TunnelFailureDiagnosticsInput = z.infer<typeof TunnelFailureDiagnosticsInputSchema>;

const TunnelFailureDiagnosticsOutputSchema = z.object({
  diagnosis: z.string().describe('A summary of the identified problem causing the tunnel failure.'),
  suggestions: z.array(z.string()).describe('A list of clear, actionable steps to resolve the tunnel failure, ordered by likelihood of success.'),
});
export type TunnelFailureDiagnosticsOutput = z.infer<typeof TunnelFailureDiagnosticsOutputSchema>;

export async function diagnoseTunnelFailure(input: TunnelFailureDiagnosticsInput): Promise<TunnelFailureDiagnosticsOutput> {
  return tunnelFailureDiagnosticsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tunnelFailureDiagnosticsPrompt',
  input: {schema: TunnelFailureDiagnosticsInputSchema},
  output: {schema: TunnelFailureDiagnosticsOutputSchema},
  prompt: `You are an expert network engineer specializing in diagnosing TCP tunnel failures.
Your task is to analyze the provided connection logs and local network status to identify the root cause of a tunnel failure and provide clear, actionable suggestions for resolution.

Connection Logs:

---
{{{connectionLogs}}}
---

Local Network Status:

---
{{{localNetworkStatus}}}
---

Based on the information above, provide:
1.  A concise diagnosis of the problem.
2.  A numbered list of actionable suggestions to fix the issue, ordered from most to least likely to resolve the problem. Ensure each suggestion is a distinct item in the list.

Respond in JSON format according to the output schema.`,
});

const tunnelFailureDiagnosticsFlow = ai.defineFlow(
  {
    name: 'tunnelFailureDiagnosticsFlow',
    inputSchema: TunnelFailureDiagnosticsInputSchema,
    outputSchema: TunnelFailureDiagnosticsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
