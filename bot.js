const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Конфигурация бота из переменных окружения
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const PAGES_DIR = path.join(__dirname, "pages");

// Проверяем что все переменные окружения установлены
if (!BOT_TOKEN || !CHANNEL_ID) {
  console.error(
    "❌ Ошибка: не найдены переменные окружения BOT_TOKEN или CHANNEL_ID"
  );
  console.error(
    "Убедитесь что файл .env существует и содержит нужные переменные"
  );
  process.exit(1);
}

// Создание экземпляра бота (без polling, так как не нужны команды)
const bot = new TelegramBot(BOT_TOKEN);

// Счетчик текущей страницы (сохраняется в файле)
const COUNTER_FILE = path.join(__dirname, "page-counter.txt");
let currentPage = 1;

// Функция для загрузки текущей страницы из файла
function loadCurrentPage() {
  try {
    if (fs.existsSync(COUNTER_FILE)) {
      const page = parseInt(fs.readFileSync(COUNTER_FILE, "utf8"));
      currentPage = page || 1;
    }
  } catch (error) {
    console.error("Ошибка при загрузке счетчика страниц:", error);
    currentPage = 1;
  }
}

// Функция для сохранения текущей страницы в файл
function saveCurrentPage() {
  try {
    fs.writeFileSync(COUNTER_FILE, currentPage.toString());
  } catch (error) {
    console.error("Ошибка при сохранении счетчика страниц:", error);
  }
}

// Функция для получения следующей страницы
function getNextPage() {
  const pageToSend = currentPage;
  currentPage = currentPage >= 604 ? 1 : currentPage + 1;
  saveCurrentPage();
  return pageToSend;
}

// Простая функция отправки страницы в канал
async function sendPageToChannel() {
  try {
    const pageNumber = getNextPage();
    const paddedPageNumber = pageNumber.toString().padStart(3, "0");
    const imagePath = path.join(PAGES_DIR, `${paddedPageNumber}.png`);

    // Проверяем существование файла
    if (!fs.existsSync(imagePath)) {
      console.error(`Файл не найден: ${imagePath}`);
      return;
    }

    // Формируем простую подпись
    const caption = `📖 Коран — Страница № ${pageNumber}`;

    // Отправляем фото с подписью
    await bot.sendPhoto(CHANNEL_ID, imagePath, { caption });

    console.log(`📄 Страница ${pageNumber} отправлена успешно`);
  } catch (error) {
    console.error("❌ Ошибка при отправке страницы:", error);
  }
}

// Настройка планировщика - каждый день в 6:00 МСК отправлять страницу
cron.schedule(
  "0 6 * * *",
  async () => {
    console.log("⏰ Время ежедневной отправки страницы Корана...");
    await sendPageToChannel();
  },
  {
    scheduled: true,
    timezone: "Europe/Moscow",
  }
);

// Загружаем текущую страницу при запуске
loadCurrentPage();

// Уведомление о запуске
console.log("🤖 Бот запущен - упрощенная версия");
console.log(`📅 Ежедневная отправка страниц в 6:00 МСК`);
console.log(`📱 Канал: ${CHANNEL_ID}`);
console.log(`📖 Текущая страница: ${currentPage}`);
