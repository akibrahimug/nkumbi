import { NextRequest, NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN || "");

export async function POST(req: NextRequest) {
  try {
    if (!process.env.HUGGINGFACE_API_TOKEN) {
      console.error("HUGGINGFACE_API_TOKEN is not configured");
      throw new Error("HUGGINGFACE_API_TOKEN is not configured");
    }

    const body = await req.json();

    const prompt: string | undefined = body.prompt || body.inputs;
    if (!prompt) {
      console.error("Missing prompt in request body");
      return NextResponse.json(
        { error: "Missing 'prompt' field in request body" },
        { status: 400 }
      );
    }

    // Check if the input is a greeting
    const isGreeting = (input: string) => {
      const greetings = ["hello", "hi", "hey"];
      return greetings.some((greet) => input.toLowerCase().includes(greet));
    };

    const formattedPrompt = `<s>[INST]
You are a Ugandan organic farming expert. Please provide very detailed answer formatted exclusively as valid HTML with inline CSS that replicates ChatGPT's design. 
The HTML should include a container element with a heading, paragraphs, proper spacing, indentation, line breaks, line height, color, font-family, font-size, font-weight.

IMPORTANT: Keep the response similar to the following format:

-   <div style="font-family: Arial, sans-serif; padding: 16px;">
-     <h3 style="color: #333333; font-size: 16px; font-weight: bold; margin-bottom: 10px;">Your title:</h3>
-     <p style="color: #555555; font-size: 16px;">Your detailed answer here...</p>
-   </div>

Question: ${prompt}
[/INST]</s>`;

    try {
      const result = await hf.textGeneration({
        model: "meta-llama/Llama-2-7b-chat-hf",
        inputs: formattedPrompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.95,
          repetition_penalty: 1.15,
          do_sample: true,
          return_full_text: false,
        },
      });

      if (!result || !result.generated_text) {
        throw new Error("No response generated from the model");
      }
      // console.log("result", result.generated_text);
      let cleanedResponse = result.generated_text.replace(
        /<s>|<\/s>|\[INST\]|\[\/INST\]/g,
        ""
      );
      // use  a regex to remove everything before the :
      cleanedResponse = cleanedResponse.replace(/^.*:/, "");

      // Fallback in case the response is empty
      if (cleanedResponse.length === 0) {
        cleanedResponse =
          "I apologize, but I couldn't generate a clear response. Please try rephrasing your question about farming.";
      }
      return NextResponse.json({
        result: {
          generated_text: isGreeting(prompt)
            ? "<div style='font-family: Arial, sans-serif; padding: 16px;'><p style='color: #555555; font-size: 16px;'>Hi, I am Nkumbi Farmers's Assistant. How can I assist you today?</p></div>"
            : cleanedResponse,
        },
      });
    } catch (modelError: any) {
      console.error("Error calling HuggingFace API:", modelError);

      // If access to Llama 2 fails, try the smaller open source model
      try {
        console.log("Trying fallback model...");
        const fallbackResult = await hf.textGeneration({
          model: "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
          inputs: formattedPrompt,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.7,
            top_p: 0.95,
            repetition_penalty: 1.15,
            do_sample: true,
          },
        });

        if (fallbackResult && fallbackResult.generated_text) {
          let fallbackResponse = fallbackResult.generated_text
            .replace(/\[\/INST\]|\[INST\]|<s>|<\/s>/g, "")
            .trim();

          if (!fallbackResponse.endsWith(".")) {
            fallbackResponse += ".";
          }

          return NextResponse.json({
            result: {
              generated_text: fallbackResponse,
            },
          });
        }
      } catch (fallbackError) {
        console.error("Fallback model also failed:", fallbackError);
      }

      throw new Error(`Model error: ${modelError.message}`);
    }
  } catch (error: any) {
    console.error("Error in API route:", error);
    const errorMessage = error.message || "Internal Server Error";
    const statusCode = error.status || 500;

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
