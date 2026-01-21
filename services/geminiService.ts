
import { GoogleGenAI } from "@google/genai";
import { Transaction } from '../types';

export async function getFinancialInsights(query: string, transactions: Transaction[]): Promise<string> {
    // API key retrieval and client initialization is done inside the function
    // to prevent app crashes on load in environments where `process` is not defined at the module scope.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return "عذرًا، مفتاح API غير مهيأ. لا يمكن للمساعد الذكي العمل.";
    }

    if (!transactions || transactions.length === 0) {
        return "لا توجد بيانات معاملات لتحليلها. يرجى إضافة بعض المعاملات أولاً.";
    }

    const ai = new GoogleGenAI({ apiKey });

    const model = 'gemini-2.5-flash';
    const transactionsJSON = JSON.stringify(transactions, null, 2);

    const prompt = `
        أنت مساعد مالي خبير ومحترف. مهمتك هي تحليل بيانات المعاملات المالية التالية والإجابة على سؤال المستخدم باللغة العربية.
        
        تعليمات:
        1.  حلل البيانات بعناية.
        2.  قدم إجابة واضحة وموجزة ومباشرة لسؤال المستخدم.
        3.  استخدم الأرقام والتفاصيل من البيانات لدعم إجابتك.
        4.  إذا كان السؤال يتعلق بمقارنات (مثل "الشهر الماضي" أو "هذا العام")، فقم بالحسابات اللازمة.
        5.  إذا كان السؤال غير واضح أو لا يمكن الإجابة عليه من البيانات المتاحة، فوضح ذلك بأدب.
        6.  تأكد من أن تكون اللغة المستخدمة في الرد هي العربية الفصحى والمهنية.

        بيانات المعاملات (JSON):
        \`\`\`json
        ${transactionsJSON}
        \`\`\`

        سؤال المستخدم:
        "${query}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "عذرًا، حدث خطأ أثناء الاتصال بمساعد الذكاء الاصطناعي. قد يكون هناك مشكلة في الشبكة أو في إعدادات مفتاح API. يرجى المحاولة مرة أخرى لاحقًا.";
    }
}
