export default function HomePage() {
  return (
    <main className="bg-white text-gray-900">

      {/* HERO */}
      <section className="py-20 text-center max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold leading-tight">
          وظّف أفضل المرشحين خلال دقائق
        </h1>
        <p className="mt-6 text-lg text-gray-600">
          JobAI يحلل السير الذاتية ويعطيك قرار توظيف ذكي خلال ثواني
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <button className="px-6 py-3 bg-black text-white rounded-xl">
            جرّب مجانًا
          </button>
          <button className="px-6 py-3 border rounded-xl">
            شاهد كيف يعمل
          </button>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="text-center py-10">
        <p className="text-gray-500">
          تم تحليل أكثر من 1000 سيرة ذاتية بدقة عالية
        </p>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">

          <div>
            <h2 className="text-3xl font-bold mb-4">المشكلة</h2>
            <ul className="space-y-3 text-gray-600">
              <li>قراءة مئات السير الذاتية يدويًا</li>
              <li>قرارات توظيف غير دقيقة</li>
              <li>هدر الوقت في الفرز</li>
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">الحل</h2>
            <ul className="space-y-3 text-gray-600">
              <li>تحليل فوري للسير الذاتية</li>
              <li>Score ذكي لكل مرشح</li>
              <li>توصيات توظيف جاهزة</li>
            </ul>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold mb-12">كيف يعمل</h2>

        <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          <div>
            <h3 className="font-semibold mb-2">1. ارفع CV</h3>
            <p className="text-gray-600">بضغطة واحدة</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. تحليل ذكي</h3>
            <p className="text-gray-600">AI يقرأ ويحلل</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. قرار فوري</h3>
            <p className="text-gray-600">Score + Recommendation</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-center">

          <div className="p-6 bg-white rounded-xl shadow">
            <h3 className="font-bold mb-2">توفير الوقت</h3>
            <p className="text-gray-600">
              وفر حتى 80% من وقت الفرز
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow">
            <h3 className="font-bold mb-2">دقة أعلى</h3>
            <p className="text-gray-600">
              قرارات مبنية على تحليل ذكي
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow">
            <h3 className="font-bold mb-2">سهولة الاستخدام</h3>
            <p className="text-gray-600">
              بدون تعقيد
            </p>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold">
          ابدأ التوظيف الذكي اليوم
        </h2>

        <button className="mt-6 px-8 py-4 bg-black text-white rounded-xl">
          ابدأ مجانًا
        </button>
      </section>

    </main>
  );
}
