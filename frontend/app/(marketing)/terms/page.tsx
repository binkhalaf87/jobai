import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return {
    title: isAr ? "شروط الاستخدام — JobAI24" : "Terms of Service — JobAI24",
    description: isAr
      ? "اقرأ شروط استخدام منصة JobAI24 لخدمات الذكاء الاصطناعي الوظيفي."
      : "Read the terms of service for JobAI24 AI-powered career platform.",
  };
}

type Section = { id: string; title: string; body: string[] };

const AR_SECTIONS: Section[] = [
  {
    id: "acceptance",
    title: "١. القبول والموافقة",
    body: [
      "بتسجيلك في منصة JobAI24 أو استخدامها بأي شكل، فإنك توافق على الالتزام بهذه الشروط وجميع السياسات المرتبطة بها. إن كنت تستخدم المنصة نيابةً عن جهة أو شركة، فإنك تُقرّ بأنك مفوَّض بتمثيلها وإلزامها بهذه الشروط.",
      "إذا كنت لا توافق على هذه الشروط، فيرجى عدم استخدام المنصة أو إنشاء حساب فيها.",
    ],
  },
  {
    id: "services",
    title: "٢. وصف الخدمات",
    body: [
      "JobAI24 منصة وظيفية مدعومة بالذكاء الاصطناعي تقدم الخدمات التالية:",
      "• **تحليل السيرة الذاتية**: قراءة وتقييم محتوى سيرتك الذاتية ومطابقتها مع متطلبات الوظائف المستهدفة.",
      "• **تحسين السيرة الذاتية**: تقديم اقتراحات وإعادة صياغة باستخدام نماذج الذكاء الاصطناعي.",
      "• **تدريب المقابلات الوظيفية**: محاكاة مقابلات حقيقية بأسئلة مخصصة وتقييم الأداء.",
      "• **البحث الوظيفي**: الاطلاع على الوظائف المناسبة من مصادر موثوقة.",
      "• **الإرسال الذكي**: إرسال رسائل تقديم مهنية بالجملة عبر حساب Gmail المرتبط.",
      "تحتفظ المنصة بحق تعديل الخدمات أو إضافة خدمات جديدة أو إيقاف أي منها دون الحاجة إلى إشعار مسبق، مع الالتزام بإعادة النقاط غير المستخدمة عند الإيقاف الكلي لخدمة ما.",
    ],
  },
  {
    id: "account",
    title: "٣. التسجيل والحساب",
    body: [
      "يجب أن يكون عمرك ١٨ سنة فأكثر لإنشاء حساب في المنصة.",
      "أنت مسؤول عن الحفاظ على سرية بيانات تسجيل الدخول الخاصة بك. يجب إخطارنا فوراً على hello@jobai24.com عند الاشتباه في أي وصول غير مصرح به لحسابك.",
      "يُمنع إنشاء أكثر من حساب واحد لكل شخص. تحتفظ المنصة بحق تعليق أو حذف الحسابات المكررة.",
      "يلتزم المستخدم بتقديم معلومات صحيحة ودقيقة عند التسجيل وتحديثها عند أي تغيير.",
    ],
  },
  {
    id: "points",
    title: "٤. نظام النقاط والمدفوعات",
    body: [
      "تعمل المنصة بنظام النقاط المدفوعة مسبقاً؛ حيث تُشترى النقاط ثم تُستهلك عند استخدام الخدمات. لا توجد اشتراكات شهرية أو رسوم دورية.",
      "أسعار الخدمات:",
      "• تحليل السيرة الذاتية: ٧ نقاط",
      "• تحسين السيرة الذاتية: ١٠ نقاط",
      "• تدريب المقابلة الوظيفية: ١٠ نقاط",
      "• الإرسال الذكي لكل شركة: يُحدَّد وفق الباقة المشتراة",
      "النقاط غير قابلة للاسترداد نقداً بعد الشراء إلا في حالات استثنائية يُقدِّرها فريق الدعم. النقاط غير قابلة للنقل بين الحسابات. تسقط النقاط غير المستخدمة بعد مرور ١٢ شهراً من تاريخ الشراء.",
      "تتم معالجة المدفوعات عبر بوابات دفع آمنة معتمدة. لا تُخزَّن بيانات البطاقات البنكية على خوادم المنصة.",
    ],
  },
  {
    id: "content",
    title: "٥. المحتوى والملكية الفكرية",
    body: [
      "تحتفظ JobAI24 بجميع حقوق الملكية الفكرية المتعلقة بالمنصة وتصميمها وبرمجياتها وعلاماتها التجارية.",
      "أنت تمتلك ملكية المحتوى الذي ترفعه (كالسيرة الذاتية)، وتمنحنا بموجب هذه الشروط ترخيصاً محدوداً وغير حصري لمعالجة هذا المحتوى بالذكاء الاصطناعي لغرض تقديم الخدمة فقط.",
      "لا يجوز إعادة نشر نتائج التحليل أو الرسائل المُولَّدة بالذكاء الاصطناعي أو الادعاء بملكيتها بشكل مخالف لأغراض التوظيف الشخصي المشروع.",
    ],
  },
  {
    id: "acceptable-use",
    title: "٦. قواعد الاستخدام المقبول",
    body: [
      "يُحظر على المستخدمين:",
      "• استخدام المنصة لأغراض غير مشروعة أو مخالفة للأنظمة السعودية المعمول بها.",
      "• رفع محتوى مضلل أو انتحال هويات أشخاص آخرين.",
      "• محاولة اختراق أنظمة المنصة أو التلاعب بآليات النقاط.",
      "• استخدام خاصية الإرسال الذكي لإرسال رسائل مزعجة (Spam) أو بريد تجاري غير مرغوب فيه.",
      "• إعادة بيع الخدمات أو استخدامها بصورة تجارية دون إذن كتابي مسبق.",
      "• استخدام أدوات آلية (bots/scrapers) للوصول إلى المنصة أو استخراج بياناتها.",
      "المخالفة تُعرِّض الحساب للتعليق الفوري أو الحذف مع احتمال المساءلة القانونية.",
    ],
  },
  {
    id: "gmail",
    title: "٧. ربط Gmail وخاصية الإرسال الذكي",
    body: [
      "تتيح المنصة ربط حساب Gmail الخاص بك لإرسال رسائل التقديم الوظيفية. هذا الربط يتطلب:",
      "• الحصول على موافقة المسؤول أولاً ثم إتمام عملية المصادقة عبر Google OAuth.",
      "• منح المنصة صلاحية إرسال البريد الإلكتروني نيابةً عنك فقط وبشكل صريح.",
      "أنت المسؤول الكامل عن محتوى الرسائل المُرسَلة عبر حسابك. تلتزم المنصة بعدم قراءة أو تخزين محتوى البريد الوارد إلى حسابك.",
      "ربط Gmail خاضع لسياسة استخدام Gmail الخاص بـ Google. يُلزَم المستخدم باحترام حدود الإرسال اليومي لـ Google (٥٠٠ رسالة يومياً كحد أقصى).",
      "يحق للمستخدم فصل الحساب في أي وقت. عند الفصل، تُحذف رموز الوصول المخزنة فوراً.",
    ],
  },
  {
    id: "disclaimer",
    title: "٨. إخلاء المسؤولية",
    body: [
      "نتائج الذكاء الاصطناعي المُقدَّمة (تحليلات، رسائل، أسئلة مقابلات) هي لأغراض إرشادية فقط ولا تُعدّ ضماناً للحصول على وظيفة.",
      "لا تضمن المنصة دقة المعلومات المُولَّدة بالكامل. المستخدم مسؤول عن مراجعة المحتوى قبل استخدامه.",
      "تُقدَّم المنصة \"كما هي\" دون ضمانات صريحة أو ضمنية تتعلق بالاستمرارية أو الخلو من الأخطاء.",
    ],
  },
  {
    id: "liability",
    title: "٩. تحديد المسؤولية",
    body: [
      "في أقصى الحدود التي يُجيزها النظام، لن تتحمل JobAI24 مسؤولية أي أضرار غير مباشرة أو تبعية أو عرضية تنشأ عن استخدام المنصة أو عدم القدرة على استخدامها.",
      "في جميع الأحوال، يُحدَّد أقصى مسؤولية للمنصة بما لا يتجاوز قيمة النقاط المدفوعة خلال الثلاثة أشهر السابقة لوقوع الضرر المدّعى به.",
    ],
  },
  {
    id: "termination",
    title: "١٠. الإنهاء والتعليق",
    body: [
      "يحق لك إلغاء حسابك في أي وقت عبر إعدادات الحساب أو بالتواصل مع الدعم.",
      "تحتفظ المنصة بحق تعليق أو إنهاء أي حساب يُخالف هذه الشروط أو يُشكّل خطراً على المنصة أو مستخدميها، وذلك فوراً ودون إشعار مسبق في حالات الإخلال الجسيم.",
      "عند الإنهاء، تُحذف بياناتك الشخصية والمرتبطة بك وفق سياسة الخصوصية المعتمدة.",
    ],
  },
  {
    id: "changes",
    title: "١١. تعديل الشروط",
    body: [
      "تحتفظ JobAI24 بحق تعديل هذه الشروط في أي وقت. سيتم إشعارك بالتعديلات الجوهرية عبر البريد الإلكتروني المسجل أو إشعار داخل المنصة قبل ١٤ يوماً من تطبيقها.",
      "استمرارك في استخدام المنصة بعد سريان التعديلات يُعدّ موافقةً ضمنية على الشروط المعدَّلة.",
    ],
  },
  {
    id: "law",
    title: "١٢. القانون الحاكم وتسوية النزاعات",
    body: [
      "تخضع هذه الشروط وتُفسَّر وفق أنظمة المملكة العربية السعودية. أي نزاع ينشأ عن هذه الشروط أو استخدام المنصة يُحسَم أمام الجهات القضائية المختصة في المملكة العربية السعودية.",
    ],
  },
  {
    id: "contact",
    title: "١٣. التواصل معنا",
    body: [
      "لأي استفسار بشأن هذه الشروط، يرجى التواصل:",
      "البريد الإلكتروني: hello@jobai24.com",
      "الموقع: www.jobai24.com",
      "آخر تحديث: يونيو ٢٠٢٥",
    ],
  },
];

const EN_SECTIONS: Section[] = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    body: [
      "By registering on or using JobAI24 in any way, you agree to be bound by these Terms of Service and all related policies. If you use the platform on behalf of an organization, you represent that you are authorized to bind that organization to these terms.",
      "If you do not agree to these terms, please do not use the platform or create an account.",
    ],
  },
  {
    id: "services",
    title: "2. Description of Services",
    body: [
      "JobAI24 is an AI-powered career platform that provides the following services:",
      "• **Resume Analysis**: Reading, evaluating, and matching your resume against targeted job requirements.",
      "• **Resume Enhancement**: AI-generated suggestions and rewriting to improve your resume.",
      "• **Interview Training**: Simulated interviews with custom questions and performance assessment.",
      "• **Job Search**: Access to relevant job postings from trusted sources.",
      "• **Smart Send**: Bulk professional application emails sent via your connected Gmail account.",
      "The platform reserves the right to modify, add, or discontinue any service without prior notice, with a commitment to refund unused points if a service is fully discontinued.",
    ],
  },
  {
    id: "account",
    title: "3. Account Registration",
    body: [
      "You must be at least 18 years old to create an account on the platform.",
      "You are responsible for maintaining the confidentiality of your login credentials. You must notify us immediately at hello@jobai24.com if you suspect unauthorized access to your account.",
      "Creating more than one account per person is prohibited. The platform reserves the right to suspend or delete duplicate accounts.",
      "You agree to provide accurate and complete information during registration and to keep it updated.",
    ],
  },
  {
    id: "points",
    title: "4. Points System & Payments",
    body: [
      "The platform operates on a prepaid points system: you purchase points which are then consumed when using services. There are no monthly subscriptions or recurring fees.",
      "Service pricing:",
      "• Resume Analysis: 7 points",
      "• Resume Enhancement: 10 points",
      "• Interview Training: 10 points",
      "• Smart Send per company: determined by selected package",
      "Points are non-refundable after purchase except in exceptional cases at the discretion of the support team. Points are non-transferable between accounts. Unused points expire 12 months from the date of purchase.",
      "Payments are processed through secure, certified payment gateways. Card data is not stored on the platform's servers.",
    ],
  },
  {
    id: "content",
    title: "5. Content & Intellectual Property",
    body: [
      "JobAI24 retains all intellectual property rights related to the platform, its design, software, and trademarks.",
      "You retain ownership of the content you upload (such as your resume) and grant us a limited, non-exclusive license to process that content with AI solely for the purpose of providing the service.",
      "AI-generated analysis results or letters may not be republished or claimed as original work in any manner inconsistent with legitimate personal job-seeking purposes.",
    ],
  },
  {
    id: "acceptable-use",
    title: "6. Acceptable Use Policy",
    body: [
      "Users are prohibited from:",
      "• Using the platform for any unlawful purpose or in violation of applicable Saudi regulations.",
      "• Uploading misleading content or impersonating other individuals.",
      "• Attempting to breach the platform's systems or manipulate the points mechanism.",
      "• Using the Smart Send feature to send spam or unsolicited commercial emails.",
      "• Reselling services or using them commercially without prior written consent.",
      "• Using automated tools (bots/scrapers) to access the platform or extract its data.",
      "Violations may result in immediate account suspension or deletion and potential legal liability.",
    ],
  },
  {
    id: "gmail",
    title: "7. Gmail Integration & Smart Send",
    body: [
      "The platform allows you to connect your Gmail account to send job application emails. This connection requires:",
      "• Prior admin approval, followed by completing the authentication via Google OAuth.",
      "• Granting the platform permission to send emails on your behalf only, explicitly.",
      "You bear full responsibility for the content of emails sent through your account. The platform commits to not reading or storing your incoming email content.",
      "Gmail integration is subject to Google's Gmail usage policies. Users must respect Google's daily sending limits (maximum 500 emails per day).",
      "You may disconnect your account at any time. Upon disconnection, stored access tokens are immediately deleted.",
    ],
  },
  {
    id: "disclaimer",
    title: "8. Disclaimers",
    body: [
      "AI-generated results (analyses, letters, interview questions) are for guidance purposes only and do not guarantee employment.",
      "The platform does not warrant the complete accuracy of AI-generated content. Users are responsible for reviewing content before use.",
      "The platform is provided \"as is\" without express or implied warranties regarding continuity or freedom from errors.",
    ],
  },
  {
    id: "liability",
    title: "9. Limitation of Liability",
    body: [
      "To the fullest extent permitted by law, JobAI24 shall not be liable for any indirect, consequential, or incidental damages arising from the use or inability to use the platform.",
      "In all cases, the platform's maximum liability shall not exceed the value of points paid during the three months preceding the alleged damage.",
    ],
  },
  {
    id: "termination",
    title: "10. Termination & Suspension",
    body: [
      "You may cancel your account at any time through account settings or by contacting support.",
      "The platform reserves the right to suspend or terminate any account that violates these terms or poses a risk to the platform or its users, immediately and without prior notice in cases of serious breach.",
      "Upon termination, your personal and associated data will be deleted in accordance with the applicable privacy policy.",
    ],
  },
  {
    id: "changes",
    title: "11. Changes to Terms",
    body: [
      "JobAI24 reserves the right to modify these terms at any time. You will be notified of material changes via your registered email or an in-platform notice at least 14 days before they take effect.",
      "Your continued use of the platform after changes take effect constitutes your acceptance of the revised terms.",
    ],
  },
  {
    id: "law",
    title: "12. Governing Law & Dispute Resolution",
    body: [
      "These terms are governed by and construed in accordance with the laws of the Kingdom of Saudi Arabia. Any dispute arising from these terms or the use of the platform shall be resolved before the competent judicial authorities in the Kingdom of Saudi Arabia.",
    ],
  },
  {
    id: "contact",
    title: "13. Contact Us",
    body: [
      "For any inquiries regarding these terms, please contact:",
      "Email: hello@jobai24.com",
      "Website: www.jobai24.com",
      "Last updated: June 2025",
    ],
  },
];

export default async function TermsPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const sections = isAr ? AR_SECTIONS : EN_SECTIONS;

  const title = isAr ? "شروط الاستخدام" : "Terms of Service";
  const subtitle = isAr
    ? "يرجى قراءة هذه الشروط بعناية قبل استخدام المنصة."
    : "Please read these terms carefully before using the platform.";
  const updatedLabel = isAr ? "آخر تحديث: يونيو ٢٠٢٥" : "Last updated: June 2025";
  const tocLabel = isAr ? "المحتويات" : "Contents";

  return (
    <div className="bg-white min-h-screen" dir={isAr ? "rtl" : "ltr"}>
      {/* Hero */}
      <div className="bg-slate-900 text-white py-16 px-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            {isAr ? "JobAI24 · الوثائق القانونية" : "JobAI24 · Legal"}
          </p>
          <h1 className="text-3xl md:text-4xl font-black mb-3">{title}</h1>
          <p className="text-slate-400 text-sm">{subtitle}</p>
          <p className="text-slate-500 text-xs mt-2">{updatedLabel}</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Table of contents */}
        <div className="mb-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">{tocLabel}</p>
          <ol className={`space-y-2 ${isAr ? "pr-4" : "pl-4"} list-decimal`}>
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-brand-700 hover:text-brand-900 hover:underline transition-colors"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-20">
              <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                {s.title}
              </h2>
              <div className="space-y-3">
                {s.body.map((para, i) => (
                  <p
                    key={i}
                    className="text-sm text-slate-600 leading-relaxed whitespace-pre-line"
                    dangerouslySetInnerHTML={{
                      __html: para.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-14 rounded-2xl border border-brand-100 bg-brand-50 p-6 text-center">
          <p className="text-sm text-brand-800 font-medium mb-1">
            {isAr ? "هل لديك سؤال حول هذه الشروط؟" : "Have a question about these terms?"}
          </p>
          <a
            href="mailto:hello@jobai24.com"
            className="text-sm text-brand-700 hover:underline font-semibold"
          >
            hello@jobai24.com
          </a>
        </div>
      </div>
    </div>
  );
}
