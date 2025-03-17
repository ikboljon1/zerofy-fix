
import React, { useState } from "react";
import MainLayout from "../components/layout/MainLayout";

const PrivacyPolicy = () => {
  const [activeTab, setActiveTab] = useState(""); // Empty string as no tab is active
  
  // Create a handler for tab changes to pass to MainLayout
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // We don't need to do anything with the tab change in this context
    // but we need to provide this function to satisfy the type requirements
  };

  return (
    <MainLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Политика конфиденциальности</h1>
        
        <div className="prose max-w-none">
          <p className="mb-4">Последнее обновление: {new Date().toLocaleDateString('ru-RU')}</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Введение</h2>
          <p>
            Zerofy ("мы", "нас" или "наш") серьезно относится к защите ваших персональных данных. Настоящая Политика конфиденциальности объясняет, как мы собираем, используем, раскрываем, обрабатываем и защищаем информацию, которую вы предоставляете при использовании нашей платформы.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Информация, которую мы собираем</h2>
          <p>
            Мы собираем следующие виды информации:
          </p>
          <ul className="list-disc ml-8 my-4">
            <li>
              <strong>Регистрационная информация:</strong> имя, адрес электронной почты, номер телефона, которые вы предоставляете при создании учетной записи.
            </li>
            <li>
              <strong>Данные о платежах:</strong> информация, необходимая для обработки платежей (мы не храним полные данные о кредитных картах).
            </li>
            <li>
              <strong>Информация о магазине:</strong> данные вашего магазина, включая статистику продаж, информацию о товарах, заказах и другие данные, импортированные из маркетплейсов.
            </li>
            <li>
              <strong>Информация об использовании:</strong> как вы взаимодействуете с нашей платформой, включая просмотренные страницы, время, проведенное на сайте, и действия.
            </li>
            <li>
              <strong>Технические данные:</strong> IP-адрес, тип устройства, тип и версия браузера, операционная система.
            </li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Как мы используем информацию</h2>
          <p>
            Мы используем собранную информацию для:
          </p>
          <ul className="list-disc ml-8 my-4">
            <li>Предоставления и улучшения наших услуг.</li>
            <li>Обработки транзакций и отправки уведомлений о транзакциях.</li>
            <li>Предоставления персонализированного опыта и аналитики.</li>
            <li>Связи с вами по поводу вашей учетной записи, наших услуг или других вопросов.</li>
            <li>Обеспечения безопасности нашей платформы.</li>
            <li>Соблюдения юридических обязательств.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Раскрытие информации</h2>
          <p>
            Мы можем раскрывать информацию следующим сторонам:
          </p>
          <ul className="list-disc ml-8 my-4">
            <li>
              <strong>Поставщикам услуг:</strong> компаниям, которые предоставляют услуги от нашего имени, например, обработка платежей, анализ данных, доставка электронной почты.
            </li>
            <li>
              <strong>Партнерам по бизнесу:</strong> мы можем предоставить определенную информацию нашим деловым партнерам для предоставления вам услуг или в маркетинговых целях.
            </li>
            <li>
              <strong>По требованию закона:</strong> мы можем раскрывать информацию, если это необходимо по закону или если мы добросовестно полагаем, что такие действия необходимы для соблюдения юридических обязательств.
            </li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Безопасность данных</h2>
          <p>
            Мы внедрили соответствующие технические и организационные меры для защиты вашей информации от несанкционированного доступа, потери, уничтожения или изменения. Однако, поскольку Интернет не является полностью безопасной средой, мы не можем гарантировать абсолютную безопасность информации.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Ваши права</h2>
          <p>
            В зависимости от вашего местоположения, вы можете иметь следующие права:
          </p>
          <ul className="list-disc ml-8 my-4">
            <li>Доступ к своим персональным данным.</li>
            <li>Исправление неточной или неполной информации.</li>
            <li>Удаление своих персональных данных.</li>
            <li>Ограничение или возражение против обработки ваших данных.</li>
            <li>Перенос ваших данных.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Хранение данных</h2>
          <p>
            Мы храним вашу информацию только в течение времени, необходимого для целей, описанных в этой Политике, или в соответствии с требованиями закона. После этого периода персональные данные будут удалены или анонимизированы.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Изменения в Политике конфиденциальности</h2>
          <p>
            Мы можем обновлять эту Политику конфиденциальности время от времени. Мы уведомим вас о значительных изменениях, разместив уведомление на нашем сайте или отправив вам уведомление по электронной почте.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Контактная информация</h2>
          <p>
            Если у вас есть вопросы или опасения относительно нашей Политики конфиденциальности или обработки ваших персональных данных, пожалуйста, свяжитесь с нами по адресу: <a href="mailto:info@zerofy.ru" className="text-primary hover:underline">info@zerofy.ru</a>
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default PrivacyPolicy;
