import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return {
    title: isAr ? "سياسة الخصوصية — JobAI24" : "Privacy Policy — JobAI24",
    description: isAr
      ? "تعرّف على كيفية جمع بياناتك الشخصية واستخدامها وحمايتها في منصة JobAI24."
      : "Learn how JobAI24 collects, uses, and protects your personal data.",
  };
}

type Section = { id: string; title: string; body: string[] };

const AR_SECTIONS: Section[] = [
  {
    id: "intro",
    title: "١. المقدمة والالتزام بالخصوصية",
    body: [
      "تلتزم منصة JobAI24 بحماية خصوصيتك وبيانات شخصك وفق نظام حماية البيانات الشخصية السعودي (PDPL) الصادر بالمرسوم الملكي م/١٩ لعام ١٤٤٣هـ ولوائحه التنفيذية، فضلاً عن المبادئ العالمية لحماية البيانات.",
      "تُوضِّح هذه السياسة ما نجمعه من بيانات، وكيفية استخدامها، وحقوقك كمستخدم. إن كنت لا توافق على هذه السياسة، يرجى الامتناع عن استخدام المنصة.",
    ],
  },
  {
    id: "data-collected",
    title: "٢. البيانات التي نجمعها",
    body: [
      "**أ. بيانات تقدمها أنت مباشرة:**",
      "• بيانات التسجيل: الاسم، البريد الإلكتروني، كلمة المرور (مُشفَّرة).",
      "• السيرة الذاتية والمستندات التي ترفعها للتحليل أو التحسين.",
      "• معلومات الوظائف المستهدفة (المسمى الوظيفي، الشركة، وصف الوظيفة).",
      "• بيانات الدفع: نعالجها عبر بوابات دفع مُرخَّصة ولا نخزّن بيانات البطاقات.",
      "**ب. بيانات نجمعها تلقائياً:**",
      "• بيانات الاستخدام: الصفحات التي تزورها، الخدمات التي تستخدمها، أوقات الجلسات.",
      "• بيانات الجهاز: نوع المتصفح، نظام التشغيل، عنوان IP.",
      "• ملفات تعريف الارتباط (Cookies) وفق القسم السابع من هذه السياسة.",
      "**ج. بيانات عبر الخدمات المرتبطة:**",
      "• عند ربط Gmail: عنوان البريد الإلكتروني وصلاحية الإرسال فقط — لا نقرأ صندوق الوارد.",
      "• نتائج التحليل والرسائل التي يُنتجها الذكاء الاصطناعي بناءً على بياناتك.",
    ],
  },
  {
    id: "use",
    title: "٣. كيف نستخدم بياناتك",
    body: [
      "نستخدم البيانات للأغراض التالية:",
      "• **تقديم الخدمة**: معالجة سيرتك الذاتية وإنتاج التحليلات والتحسينات والمقابلات التدريبية.",
      "• **إرسال الإيميلات**: تنفيذ طلبات الإرسال الذكي عبر حسابك المرتبط.",
      "• **التواصل معك**: إرسال إشعارات الخدمة وتحديثات الحساب والردود على استفساراتك.",
      "• **تحسين المنصة**: تحليل أنماط الاستخدام لتطوير الخدمات وتحسين تجربة المستخدم.",
      "• **الأمن والامتثال**: كشف الاحتيال والإساءات، والالتزام بالمتطلبات القانونية.",
      "لا نستخدم بياناتك لإعلانات مستهدفة ولا نبيعها لأي جهة ثالثة.",
    ],
  },
  {
    id: "sharing",
    title: "٤. مشاركة البيانات",
    body: [
      "لا نشارك بياناتك الشخصية مع جهات خارجية إلا في الحالات التالية:",
      "• **مزودو الخدمة**: نستعين بمزودين موثوقين لتشغيل المنصة (استضافة سحابية، معالجة الذكاء الاصطناعي عبر Anthropic Claude API، بوابات الدفع) بموجب اتفاقيات حماية بيانات صارمة.",
      "• **Google**: عند استخدام Gmail OAuth، تخضع البيانات المشتركة مع Google لسياسة خصوصية Google.",
      "• **الجهات القانونية والتنظيمية**: إذا طُلب ذلك بموجب أوامر قضائية أو لوائح نظامية معتمدة.",
      "• **موافقتك الصريحة**: لأي غرض آخر لم يُذكر هنا بعد إخطارك والحصول على موافقتك.",
    ],
  },
  {
    id: "storage",
    title: "٥. تخزين البيانات وأمانها",
    body: [
      "**مكان التخزين**: تُخزَّن البيانات على خوادم سحابية آمنة. نسعى لاستخدام خوادم في المنطقة الجغرافية المناسبة وفق متطلبات نظام PDPL.",
      "**مدة الاحتفاظ**: نحتفظ ببياناتك طالما كان حسابك نشطاً. عند حذف الحساب، تُحذف البيانات الشخصية خلال ٣٠ يوماً باستثناء ما يستلزمه القانون الاحتفاظ به.",
      "**الإجراءات الأمنية**: نستخدم تشفير HTTPS لجميع الاتصالات، وتشفير رموز Gmail المخزنة، وتشفير كلمات المرور باستخدام خوارزميات bcrypt.",
      "لا توجد وسيلة نقل بيانات مضمونة بنسبة ١٠٠٪ عبر الإنترنت. بالرغم من جهودنا الجادة، لا نستطيع ضمان أمان مطلق للبيانات.",
    ],
  },
  {
    id: "rights",
    title: "٦. حقوقك وفق نظام حماية البيانات الشخصية (PDPL)",
    body: [
      "يمنحك نظام حماية البيانات الشخصية السعودي الحقوق التالية:",
      "• **الاطلاع**: الحق في معرفة البيانات التي نحتفظ بها عنك.",
      "• **التصحيح**: طلب تصحيح أي بيانات غير دقيقة.",
      "• **الحذف**: طلب حذف بياناتك الشخصية (مع مراعاة الالتزامات القانونية).",
      "• **الاعتراض**: الاعتراض على معالجة بياناتك لأغراض معينة.",
      "• **سحب الموافقة**: سحب موافقتك في أي وقت دون أثر رجعي على المعالجة السابقة.",
      "لممارسة أي من هذه الحقوق، راسلنا على: hello@jobai24.com مع توضيح طلبك. سنردّ خلال ٣٠ يوماً.",
    ],
  },
  {
    id: "cookies",
    title: "٧. ملفات تعريف الارتباط (Cookies)",
    body: [
      "نستخدم ملفات تعريف الارتباط للأغراض التالية:",
      "• **ضرورية**: للحفاظ على جلسة تسجيل الدخول وأمان الحساب — لا يمكن تعطيلها.",
      "• **التفضيلات**: حفظ اللغة المفضلة وإعدادات الواجهة.",
      "• **التحليل**: قياس استخدام المنصة لتحسين الخدمة (بيانات مجمعة وغير شخصية).",
      "يمكنك إدارة ملفات تعريف الارتباط من إعدادات متصفحك. تعطيل الملفات الضرورية قد يؤثر على وظائف المنصة الأساسية.",
    ],
  },
  {
    id: "third-party",
    title: "٨. الخدمات الخارجية",
    body: [
      "تستخدم المنصة الخدمات الخارجية التالية التي تخضع لسياسات خصوصيتها الخاصة:",
      "• **Anthropic (Claude API)**: معالجة النصوص وتوليد المحتوى بالذكاء الاصطناعي.",
      "• **Google (Gmail OAuth & APIs)**: ربط البريد الإلكتروني وإرسال الرسائل.",
      "• **Railway / Vercel**: استضافة البنية التحتية للمنصة.",
      "• **بوابات الدفع**: معالجة المعاملات المالية.",
      "ننصح بمراجعة سياسات الخصوصية الخاصة بهذه الجهات لمزيد من المعلومات.",
    ],
  },
  {
    id: "children",
    title: "٩. خصوصية القاصرين",
    body: [
      "لا تستهدف المنصة الأطفال دون ١٨ عاماً ولا تجمع بياناتهم عن قصد. إن علمنا بجمع بيانات قاصر، سنحذفها فوراً. إذا كنت ولياً للأمر وتعتقد أن طفلك سجّل في المنصة، يرجى التواصل معنا.",
    ],
  },
  {
    id: "changes",
    title: "١٠. تغييرات على سياسة الخصوصية",
    body: [
      "قد نُحدِّث هذه السياسة دورياً. سنُخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني المسجل أو إشعار بارز داخل المنصة قبل ١٤ يوماً من تطبيقها.",
      "تاريخ آخر تعديل موضح في أعلى هذه الصفحة. استمرارك في استخدام المنصة بعد سريان التعديلات يعني قبولها.",
    ],
  },
  {
    id: "contact",
    title: "١١. التواصل وتقديم الشكاوى",
    body: [
      "لأي استفسار أو طلب يتعلق بخصوصيتك:",
      "البريد الإلكتروني: hello@jobai24.com",
      "الموقع: www.jobai24.com",
      "يحق لك أيضاً تقديم شكوى إلى الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا) إن رأيت أن بياناتك تُعالَج بصورة مخالفة للنظام.",
      "آخر تحديث: يونيو ٢٠٢٥",
    ],
  },
];

const EN_SECTIONS: Section[] = [
  {
    id: "intro",
    title: "1. Introduction & Privacy Commitment",
    body: [
      "JobAI24 is committed to protecting your privacy and personal data in accordance with Saudi Arabia's Personal Data Protection Law (PDPL), issued by Royal Decree M/19 of 1443H and its implementing regulations, as well as international best practices for data protection.",
      "This policy explains what data we collect, how we use it, and your rights as a user. If you do not agree to this policy, please refrain from using the platform.",
    ],
  },
  {
    id: "data-collected",
    title: "2. Data We Collect",
    body: [
      "**A. Data you provide directly:**",
      "• Registration data: name, email address, password (hashed).",
      "• Resumes and documents you upload for analysis or enhancement.",
      "• Target job information (job title, company name, job description).",
      "• Payment data: processed through licensed payment gateways — we do not store card details.",
      "**B. Data collected automatically:**",
      "• Usage data: pages you visit, services you use, session times.",
      "• Device data: browser type, operating system, IP address.",
      "• Cookies as described in Section 7 of this policy.",
      "**C. Data via connected services:**",
      "• Gmail integration: your email address and send-only permission — we do not read your inbox.",
      "• AI-generated analysis results and messages based on your data.",
    ],
  },
  {
    id: "use",
    title: "3. How We Use Your Data",
    body: [
      "We use data for the following purposes:",
      "• **Service delivery**: processing your resume and generating analyses, enhancements, and interview simulations.",
      "• **Email sending**: executing Smart Send requests via your linked Gmail account.",
      "• **Communication**: sending service notifications, account updates, and responses to your inquiries.",
      "• **Platform improvement**: analyzing usage patterns to develop services and enhance user experience.",
      "• **Security & compliance**: detecting fraud and abuse, and meeting legal requirements.",
      "We do not use your data for targeted advertising and do not sell it to any third party.",
    ],
  },
  {
    id: "sharing",
    title: "4. Data Sharing",
    body: [
      "We do not share your personal data with third parties except in the following cases:",
      "• **Service providers**: we engage trusted providers to operate the platform (cloud hosting, AI processing via Anthropic Claude API, payment gateways) under strict data protection agreements.",
      "• **Google**: when using Gmail OAuth, data shared with Google is subject to Google's Privacy Policy.",
      "• **Legal & regulatory authorities**: if required by court orders or applicable regulatory requirements.",
      "• **Your explicit consent**: for any purpose not mentioned here, after notifying you and obtaining your consent.",
    ],
  },
  {
    id: "storage",
    title: "5. Data Storage & Security",
    body: [
      "**Storage location**: data is stored on secure cloud servers. We strive to use servers in the appropriate geographic region in accordance with PDPL requirements.",
      "**Retention period**: we retain your data as long as your account is active. Upon account deletion, personal data is deleted within 30 days, except where legally required to retain it.",
      "**Security measures**: we use HTTPS encryption for all communications, encryption for stored Gmail tokens, and bcrypt hashing for passwords.",
      "No method of data transmission over the internet is 100% secure. Despite our serious efforts, we cannot guarantee absolute data security.",
    ],
  },
  {
    id: "rights",
    title: "6. Your Rights Under PDPL",
    body: [
      "Saudi Arabia's Personal Data Protection Law grants you the following rights:",
      "• **Access**: the right to know what data we hold about you.",
      "• **Correction**: request correction of any inaccurate data.",
      "• **Deletion**: request deletion of your personal data (subject to legal obligations).",
      "• **Objection**: object to processing your data for certain purposes.",
      "• **Withdrawal of consent**: withdraw your consent at any time without retroactive effect on prior processing.",
      "To exercise any of these rights, email us at: hello@jobai24.com with a description of your request. We will respond within 30 days.",
    ],
  },
  {
    id: "cookies",
    title: "7. Cookies",
    body: [
      "We use cookies for the following purposes:",
      "• **Essential**: to maintain your login session and account security — these cannot be disabled.",
      "• **Preferences**: to save your preferred language and interface settings.",
      "• **Analytics**: to measure platform usage for service improvement (aggregated, non-personal data).",
      "You can manage cookies through your browser settings. Disabling essential cookies may affect core platform functionality.",
    ],
  },
  {
    id: "third-party",
    title: "8. Third-Party Services",
    body: [
      "The platform uses the following third-party services, which are subject to their own privacy policies:",
      "• **Anthropic (Claude API)**: text processing and AI content generation.",
      "• **Google (Gmail OAuth & APIs)**: email integration and message sending.",
      "• **Railway / Vercel**: platform infrastructure hosting.",
      "• **Payment gateways**: financial transaction processing.",
      "We recommend reviewing the privacy policies of these parties for more information.",
    ],
  },
  {
    id: "children",
    title: "9. Children's Privacy",
    body: [
      "The platform is not intended for children under 18 and does not knowingly collect their data. If we become aware of data collected from a minor, we will delete it immediately. If you are a parent or guardian who believes your child has registered on the platform, please contact us.",
    ],
  },
  {
    id: "changes",
    title: "10. Changes to This Policy",
    body: [
      "We may periodically update this policy. We will notify you of any material changes via your registered email or a prominent notice within the platform at least 14 days before they take effect.",
      "The date of the last update is shown at the top of this page. Your continued use of the platform after changes take effect constitutes your acceptance of them.",
    ],
  },
  {
    id: "contact",
    title: "11. Contact & Complaints",
    body: [
      "For any privacy-related inquiries or requests:",
      "Email: hello@jobai24.com",
      "Website: www.jobai24.com",
      "You also have the right to file a complaint with the Saudi Data and Artificial Intelligence Authority (SDAIA) if you believe your data is being processed in violation of applicable law.",
      "Last updated: June 2025",
    ],
  },
];

export default async function PrivacyPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const sections = isAr ? AR_SECTIONS : EN_SECTIONS;

  const title = isAr ? "سياسة الخصوصية" : "Privacy Policy";
  const subtitle = isAr
    ? "نلتزم بحماية بياناتك وفق نظام حماية البيانات الشخصية السعودي (PDPL)."
    : "We are committed to protecting your data under Saudi Arabia's PDPL.";
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
        {/* PDPL badge */}
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3">
          <span className="text-teal-600 text-lg">🔒</span>
          <p className="text-sm text-teal-800">
            {isAr
              ? "هذه السياسة متوافقة مع نظام حماية البيانات الشخصية السعودي (PDPL) الصادر عام ١٤٤٣هـ."
              : "This policy complies with Saudi Arabia's Personal Data Protection Law (PDPL) issued in 1443H."}
          </p>
        </div>

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
            {isAr ? "هل لديك سؤال حول خصوصيتك؟" : "Have a question about your privacy?"}
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
