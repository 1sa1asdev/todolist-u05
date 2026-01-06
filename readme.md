
# [PROJECT U05 ](https://isaiasu02.netlify.app/)
  - Denna applikation är en CRUD baserad    Todolist app som använder email-autentisering via supabase molntjänsten för att lagra användarens sparade todo's   
  Styrka
  - Struktur och simplicitet, CRUD processen är lätt att följa i Main.ts

  Svaghet
  - Html byggs som strängar, detta leder till att det kan vara jobbigt att 
# Vad är TypeScript och varför använder man det istället för vanlig JavaScript?

JavaScript gör sidor interaktiva det kan hantera användarinteraktioner, hämta och uppdatera data, validera formulär, autentisera information, och manipulera både utseende och grafik dynamiskt.
Medans TypeScript är ett superset av JavaScript som tillför statisk typkontroll, bättre verktygsstöd och tydligare kodstruktur. Detta gör att många fel upptäcks tidigt och att koden blir mer robust och lättare att underhålla, särskilt i större projekt.
# Förklara skillnaden mellan unknown, any och en specifik typ som string. När bör man använda de olika typerna?

any, inaktiverar typkontroll helt kan vara bra om man inte ska göra något storskaligt eller vill göra en prototyp för att bespara tid.

unknown kan göra samma sak som any men typen/typerna måste vara fastställda innan för att kunna användas detta är bra för api's och user input eller någon form av extern data som 

En specifik typ som "string" innebär att endast ett värde som är en string kan passera


# Vad är syftet med att använda types/interfaces i TypeScript? Varför är de viktiga när man bygger större projekt?

Types/interfaces används som en receptlista som beskriver strukturen, egenskaperna och typerna av objekt och data i programmet i fråga. Detta recept förhindrar att felaktig data användas och ökar läsbarhet när man jobbar på större projekt genom att förtydliga hur olika typer av data används och förväxlas i olika delar av kodbasen.


