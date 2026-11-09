# Rezerwacja sprzętu szkolnego

## Autor

Michał Węglarczyk (projekt indywidualny)

## Cel aplikacji

Aplikacja jest dla uczniów oraz opiekuna pracowni. Rozwiązuje problem
papierowych list i ustnych umówień, przez które sprzęt (laptopy, projektory,
aparaty) bywa zarezerwowany przez dwie osoby naraz albo ginie bez śladu.

Przykład użycia: uczeń loguje się, wybiera laptop, rezerwuje go na środę
na lekcje 3-4, a opiekun pracowni zatwierdza wydanie sprzętu.

## Planowane funkcje

1. Uczeń rejestruje się i loguje do aplikacji.
2. Uczeń przegląda listę dostępnego sprzętu.
3. Uczeń rezerwuje wybrany sprzęt na termin (data od - do).
4. Uczeń widzi swoje rezerwacje i może odwołać wybraną rezerwację.
5. Opiekun pracowni widzi wszystkie rezerwacje i zatwierdza lub odrzuca je.
6. Opiekun dodaje i usuwa sprzęt z listy.

## Technologie i dane

- Interfejs: React (Vite)
- Serwer: Node.js + Express (REST API)
- Baza danych: SQLite (plik na serwerze), obsługiwana przez serwer Express
- Logowanie: hasła haszowane (bcrypt), sesja przez token JWT

## Zagrożenia i zabezpieczenia

| Zagrożenie                                                                | Zabezpieczenie                                                     |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Uczeń odwołuje lub zmienia cudzą rezerwację (zmiana ID w żądaniu)         | Serwer sprawdza, czy rezerwacja należy do zalogowanego użytkownika |
| Uczeń wysyła żądanie operacji opiekuna (zatwierdzanie, dodawanie sprzętu) | Serwer sprawdza rolę użytkownika przy każdej takiej operacji       |
| Wysłanie błędnych danych (data końca przed początkiem, brak pola)         | Walidacja danych po stronie serwera                                |
| Wpisanie kodu HTML/JS w komentarzu                                        | React wyświetla treść jako tekst, a serwer dodatkowo ją czyści     |
| Wstrzyknięcie SQL przez formularz                                         | Zapytania parametryzowane                                          |
| Wyciek haseł                                                              | Hasła haszowane bcryptem, sekrety w pliku .env poza repozytorium   |
| Podwójna rezerwacja tego samego sprzętu w tym samym terminie              | Serwer sprawdza dostępność przed zapisem                           |

## Plan pracy

1. Konfiguracja projektu, repozytorium i README
2. Jedna funkcja od początku do końca: logowanie + lista sprzętu
3. Rezerwowanie i odwoływanie rezerwacji
4. Panel opiekuna (zatwierdzanie, zarządzanie sprzętem)
5. Zabezpieczenia i testy opisane w README
6. Porządki, instrukcja uruchomienia i prezentacja

## Instrukcja uruchomienia

(do uzupełnienia po zrobieniu aplikacji)

## Testy zabezpieczeń

(do uzupełnienia po zrobieniu zabezpieczeń)
