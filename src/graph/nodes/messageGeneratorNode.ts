import z from 'zod/v3';
import { getSystemPrompt, getUserPromptTemplate, MessageSchema } from '../../prompts/v1/messageGenerator.ts';
import { OpenRouterService } from '../../services/openRouterService.ts';
import type { GraphState } from '../graph.ts';
import { AIMessage } from 'langchain';

export function createMessageGeneratorNode(llmService: OpenRouterService) {
    return async (state: GraphState): Promise<Partial<GraphState>> => {
        console.log(`💬 Generating response message...`);

        try {

            const hasSucceeded = state.actionSuccess === true;
            const cenario = `${state.intent ?? 'unknown'}_${hasSucceeded}`;
            const detalhes = {
                professionalName: state.professionalName,
                datetime: state.datetime,
                patientName: state.patientName,
                error: state.error
            };

            const systemPrompt = getSystemPrompt();
            const userPrompt = getUserPromptTemplate({ cenario, detalhes });

            const result = await llmService.generateStructured(systemPrompt, userPrompt, MessageSchema);


            if (result.error) {
                console.error(`❌ Error generating message: ${result.error}`);
                return {
                    messages: [
                        ...state.messages,
                        new AIMessage('An error occurred while generating the message.')
                    ],
                };
            }
            console.log(`✅ Message generated successfully`, result.data?.message ?? result.data ?? result);

            return {
                messages: [
                    ...state.messages,
                    new AIMessage(result.data!.message)
                ],
            };
        } catch (error) {
            console.error('❌ Error in messageGenerator node:', error);
            return {
                ...state,
                messages: [
                    ...state.messages,
                    new AIMessage('An error occurred while processing your request.')
                ],
            };
        }
    };
}
