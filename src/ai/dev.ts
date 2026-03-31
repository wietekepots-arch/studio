import { config } from 'dotenv';
config();

import '@/ai/flows/ai-short-description-drafting.ts';
import '@/ai/flows/ai-blip-categorization-flow.ts';
import '@/ai/flows/ai-blip-prefill-flow.ts';
