import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Create Quiz
        const quiz = await base44.entities.Quiz.create({
            title: "English-Turkish Translation Test (EN-TR)",
            description: "Professional translation assessment covering grammatical accuracy, terminology, and localization skills",
            instructions: "This quiz contains 35 questions testing your English-Turkish translation skills. You will encounter true/false grammar questions, multiple choice translation exercises, and error category identification tasks.",
            passing_score: 70,
            total_points: 100,
            is_active: true,
            required_for_approval: false
        });

        // Yes/No questions (20 questions × 1.5 points = 30 points)
        const yesNoQuestions = [
            { text: "Bu kanun, 09/Mart/2022'de yürürlüğe girecek.", answer: "Evet", order: 1 },
            { text: "Bu mağazadan şu ürünleri alabilirsiniz: rimel, oje, ruj ve diğer makyaj malzemeleri.", answer: "Hayır", order: 2 },
            { text: "Boğaziçi Üniversitesi'nde okurken İspanyolca'ya önem verdim.", answer: "Evet", order: 3 },
            { text: "Tüm dünyadan birçok bilim insanı, düzenlediğimiz bu iklim konferansında bir araya geliyorlar.", answer: "Evet", order: 4 },
            { text: "15 ila 20 yıl içinde bu türün yok olacağı öngörülüyor.", answer: "Hayır", order: 5 },
            { text: "Ben; salonu, mutfağı, banyoyu temizledim, o da bana yardım etti.", answer: "Evet", order: 6 },
            { text: "Madem ki gelmeyecektin, önceden haber verseydin ya!", answer: "Hayır", order: 7 },
            { text: "İşini bıraktığından beri, Bodrum'da mütevazi bir hayat sürüyor.", answer: "Evet", order: 8 },
            { text: "'Bu saatte nereye gittiğimi söylemeyeceğim.' dedi.", answer: "Hayır", order: 9 },
            { text: "Her sene Ağustos ayında tatile gideriz.", answer: "Evet", order: 10 },
            { text: "Bu sorunu birebir görüşmelerle çözüme ulaştıracağımıza inanıyoruz.", answer: "Evet", order: 11 },
            { text: "Boya, fırça, defter, vb. malzemeleri almasına gerek yoktu.", answer: "Evet", order: 12 },
            { text: "Bir gün ben de sana yardımcı olacağım.", answer: "Hayır", order: 13 },
            { text: "Her bir çocuk için elinden gelenin en iyisini yapmış birçok öğretmen var.", answer: "Hayır", order: 14 },
            { text: "İster kapıma dayansın, ister hiç aramasın, umurumda değil.", answer: "Evet", order: 15 },
            { text: "Sınava girmeden önce Gizlilik Politikalarına göz attığınızı varsayıyoruz.", answer: "Evet", order: 16 },
            { text: "Bu konuda uzmanlaşmak istiyorsanız çeşitli kurslarımıza (ör. 'Dijital Dünyada Nasıl Reklam Verilir?') kaydolabilirsiniz.", answer: "Hayır", order: 17 },
            { text: "Katılımcıların 90 %'ı bu ürünü arkadaşlarına tavsiye edeceğini belirtti.", answer: "Evet", order: 18 },
            { text: "Bir kitap yazarsam adını 'Müdür, Müdür müdür?' koyacağım.", answer: "Hayır", order: 19 },
            { text: "Geçen yıl Türkiye Büyük Millet Meclisini ziyaret ettik.", answer: "Hayır", order: 20 }
        ];

        // Translation questions (10 questions × 5 points = 50 points)
        const translationQuestions = [
            {
                text: "Translate: 'Or, you can simply tap Close (X).'",
                options: [
                    "Dilerseniz Kapat'a (X) dokunabilirsiniz.",
                    "Veya Kapat seçeneğine basabilirsiniz.",
                    "Ya da basitçe Kapat'ı tıklayabilirsiniz.",
                    "Veya Close düğmesine dokunun (X)."
                ],
                answer: "Dilerseniz Kapat'a (X) dokunabilirsiniz.",
                order: 21
            },
            {
                text: "Translate: 'Please provide contact information for the end customer below until January 1, 2022, so that we can invite them to enroll their support agreement.'",
                options: [
                    "Lütfen sonbahar müşterisinin iletişim bilgilerini 1 Ocak 2022'ye kadar sağlayın.",
                    "Son müşteriyi destek sözleşmesine kaydolmaya davet edebilmemiz için lütfen kendisine ait iletişim bilgilerini 1 Ocak 2022'ye kadar aşağıya girin.",
                    "Son müşteri için iletişim bilgilerini 1 Ocak 2022'den önce vermeniz gerekir.",
                    "Lütfen müşterinin iletişim bilgilerini 2022 yılına kadar sağlayınız."
                ],
                answer: "Son müşteriyi destek sözleşmesine kaydolmaya davet edebilmemiz için lütfen kendisine ait iletişim bilgilerini 1 Ocak 2022'ye kadar aşağıya girin.",
                order: 22
            },
            {
                text: "Translate: 'Or you can check the bar at the bottom of the page to see your progress.'",
                options: [
                    "Dilerseniz sayfanın en altındaki çubuğa bakarak da ilerleme durumunuzu görebilirsiniz.",
                    "Veya sayfanın altındaki bar'ı kontrol edebilirsiniz.",
                    "Ya da sayfa sonundaki ilerleme göstergesini kontrol edebilirsiniz.",
                    "Sayfanın alt kısmındaki bar sayesinde ilerleyebilirsiniz."
                ],
                answer: "Dilerseniz sayfanın en altındaki çubuğa bakarak da ilerleme durumunuzu görebilirsiniz.",
                order: 23
            },
            {
                text: "Translate: 'For example, 50-minute run-time trims up to 1,200 square feet per charge.'",
                options: [
                    "Örneğin, 50 dakikalık bir çalışma süresi tek şarjla 1.200 metrekareye kadar biçme sağlar.",
                    "Örneğin, 50 dakikalık çalışma süresi, tek şarjla 1.200 fitkareye kadar biçme sağlar.",
                    "Örneğin 50 dakika çalışma zamanı, ücret başına 1200 fit biçebilir.",
                    "50 dakikalık zaman diliminde 1.200 fit kare alanı kesilir."
                ],
                answer: "Örneğin, 50 dakikalık çalışma süresi, tek şarjla 1.200 fitkareye kadar biçme sağlar.",
                order: 24
            },
            {
                text: "Translate: 'When the price of your product later drops to $7,000 or lower, Small and Light fulfillment fees will apply.'",
                options: [
                    "Ürün fiyatı $7000'in altına düştüğünde hafif kargo ücreti uygulanır.",
                    "Ürününüzün fiyatı 7 000 ABD dolarına veya altına düştüğünde Küçük ve Hafif lojistik ücretleri geçerli olur.",
                    "Ürünün fiyatı 7000 dolar veya daha az olduğunda hafif teslimat ücretleri uygulanacaktır.",
                    "Fiyat 7000 dolara düştüğünde küçük ve hafif gönderi ücreti kaldırılır."
                ],
                answer: "Ürününüzün fiyatı 7 000 ABD dolarına veya altına düştüğünde Küçük ve Hafif lojistik ücretleri geçerli olur.",
                order: 25
            },
            {
                text: "Translate: 'I'm happy to report that the claim has been granted and your refund was processed on Tuesday, January 1st at hh:mm.'",
                options: [
                    "Talebin onaylandığını ve 1 Ocak Salı günü para iadenizin işleme alındığını bildirmekten mutluluk duyarım.",
                    "Talebin kabul edildiğini ve para iadesi Salı günü işleme alındığını memnuniyetle bildiriyorum.",
                    "Talebin onaylandığını ve 1 Ocak Salı günü saat ss.dd itibarıyla para iadenizin işleme alındığını bildirmekten mutluluk duyarım.",
                    "Iddianın onaylandığını ve geri ödeme Ocak ayında yapılacağını memnuniyetle duyuruyorum."
                ],
                answer: "Talebin onaylandığını ve 1 Ocak Salı günü saat ss.dd itibarıyla para iadenizin işleme alındığını bildirmekten mutluluk duyarım.",
                order: 26
            },
            {
                text: "Translate: 'On average, advertisers see +2.5% conversion value, at a similar cost to standard Shopping campaigns.'",
                options: [
                    "Ortalama olarak, reklamverenler standart Alışveriş kampanyalarıyla aynı maliyetle +%2,5 dönüşüm değeri elde ediyor.",
                    "Reklamverenler, standart Alışveriş kampanyalarıyla hemen hemen aynı maliyetle ortalama +%2,5 dönüşüm değeri elde ediyor.",
                    "Reklamcılar benzer bir fiyatla %2,5 artış görüyor.",
                    "Yapılan reklamların ortalama dönüşüm oranı %2,5 artacaktır."
                ],
                answer: "Reklamverenler, standart Alışveriş kampanyalarıyla hemen hemen aynı maliyetle ortalama +%2,5 dönüşüm değeri elde ediyor.",
                order: 27
            },
            {
                text: "Translate: 'Sixty-seven percent of holiday shoppers said they plan to confirm online that an item is in stock before going to buy it.'",
                options: [
                    "Yılbaşı döneminde alışveriş yapanların %67'si satın alacağı ürünün stokta olduğunu mağazaya gitmeden önce internet üzerinden doğrulamayı planladığını belirtti.",
                    "%67 kişi tatil döneminde alışveriş yaparken önce internet'te kontrol etmek istiyor.",
                    "Yılbaşı alışveriş yapan müşterilerin 67 oranında ürün stokunu online olarak kontrol etmesi planlanıyor.",
                    "Tatil alışveriş yapanların %67'si satın almadan önce ürünü kontrol etmek istediğini söyledi."
                ],
                answer: "Yılbaşı döneminde alışveriş yapanların %67'si satın alacağı ürünün stokta olduğunu mağazaya gitmeden önce internet üzerinden doğrulamayı planladığını belirtti.",
                order: 28
            },
            {
                text: "Translate: 'As a system default, the standard rate product tax code will be set as the seller default product tax code.'",
                options: [
                    "Sistem varsayılanı olarak, standart oranlı ürün vergi kodu, satıcının varsayılan ürün vergi kodu olarak ayarlanır.",
                    "Standart ürün vergi kodu satıcının standart vergi kodu olarak sisteme girer.",
                    "Sistem tarafından, ürün vergi kodu otomatik olarak satıcının varsayılan kodu olarak ayarlanır.",
                    "Sistem varsayılanı satıcı ürün vergi kodu için standart hız kodunu kullanır."
                ],
                answer: "Sistem varsayılanı olarak, standart oranlı ürün vergi kodu, satıcının varsayılan ürün vergi kodu olarak ayarlanır.",
                order: 29
            },
            {
                text: "Translate: 'Centennials double-check advertising messages, and this is less common than Generation Y (40%).'",
                options: [
                    "Z kuşağı reklam mesajlarını kontrol ediyor, bu Y kuşağında daha yaygın (%40).",
                    "Z kuşağı, reklam mesajlarını birkaç kez kontrol ediyor ve bunu yapanların oranı Y kuşağına (%40) kıyasla daha düşük.",
                    "Z kuşağının reklam kontrolü, Y kuşağından daha az (%40).",
                    "Genç nesil reklamları kontrol ediyor ancak bu eğilim %40 oranında Y kuşağına göre daha az."
                ],
                answer: "Z kuşağı, reklam mesajlarını birkaç kez kontrol ediyor ve bunu yapanların oranı Y kuşağına (%40) kıyasla daha düşük.",
                order: 30
            }
        ];

        // Category error questions (5 questions × 4 points = 20 points)
        // For simplicity, marking categories as text in options
        const categoryQuestions = [
            {
                text: "Identify the error categories in: 'Kalan (sipariş edilen adetten onaylanan adet çıkarıldığında elde edilen adet) teslimat zaman aralığı bitiminde iptal edilir.' (Choose 2)",
                options: ["Accuracy", "Punctuation", "Spelling", "Grammar"],
                answer: "Accuracy|Punctuation",
                order: 31
            },
            {
                text: "Identify the error categories in: 'En az 48 saat arayla art arda iki red kodu gönderirseniz, sistem sizi uyarır.' (Choose 2)",
                options: ["Punctuation", "Spelling", "Grammar", "Tags/placeholders"],
                answer: "Punctuation|Spelling",
                order: 32
            },
            {
                text: "Identify the error categories in: 'Görünüşe göre, geçerli olmayan ve WhatsApp tarafından desteklenen bir telefon numarası kullanıyorsunuz.' (Choose 2)",
                options: ["Accuracy", "Tags/placeholders", "Grammar", "Spelling"],
                answer: "Accuracy|Tags/placeholders",
                order: 33
            },
            {
                text: "Identify the error categories in: 'Alanınızda veya başka bir alanda bu {count} sözleşmeleri ihlal eden kullanıcı tarafından her türlü ihlali lütfen bize bildirin.' (Choose 2)",
                options: ["Accuracy", "Grammar", "Punctuation", "Spelling"],
                answer: "Accuracy|Grammar",
                order: 34
            },
            {
                text: "Identify the error categories in: 'Mağazanızı videolar ve 3B öğeleri otomatik yönetebileceğiniz şekilde ayarlamak için lütfen mağazanızın temasını güncelleyin; bunu nasıl yapacağınızla ilgili daha fazla bilgiyi yardım belgelerimizde bulabilirsiniz.' (Choose 2)",
                options: ["Punctuation", "Grammar", "Accuracy", "Spelling"],
                answer: "Punctuation|Grammar",
                order: 35
            }
        ];

        // Insert Yes/No questions
        for (const q of yesNoQuestions) {
            await base44.entities.Question.create({
                quiz_id: quiz.id,
                question_text: q.text,
                question_type: "true_false",
                options: ["Evet", "Hayır"],
                correct_answer: q.answer,
                points: 1.5,
                order: q.order,
                section: "Grammar & Accuracy"
            });
        }

        // Insert translation questions
        for (const q of translationQuestions) {
            await base44.entities.Question.create({
                quiz_id: quiz.id,
                question_text: q.text,
                question_type: "multiple_choice",
                options: q.options,
                correct_answer: q.answer,
                points: 5,
                order: q.order,
                section: "Translation Skills"
            });
        }

        // Insert category questions
        for (const q of categoryQuestions) {
            await base44.entities.Question.create({
                quiz_id: quiz.id,
                question_text: q.text,
                question_type: "multiple_choice",
                options: q.options,
                correct_answer: q.answer,
                points: 4,
                order: q.order,
                section: "Error Identification"
            });
        }

        return Response.json({ 
            success: true,
            quiz: quiz,
            questionsCreated: 35,
            totalPoints: 100,
            message: "EN-TR Quiz created with 35 questions (100 points total)"
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});