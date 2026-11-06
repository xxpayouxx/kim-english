# Kim English • préproduction personnelle

Le Worker sert l’interface et appelle Workers AI côté serveur. En l’absence d’IA, Kim affiche explicitement le mode exercices. La progression reste dans Safari, par adresse de site. La préproduction possède donc sa propre progression. Les derniers échanges et les trois dernières difficultés sont envoyés au modèle lors d’une réponse. Les exercices fonctionnent aussi sur un hébergement statique.

## Test et déploiement isolé

1. Utiliser uniquement un compte **Cloudflare Workers Free**, sans mise à niveau. En cas de demande de paiement, interrompre la configuration. Tarification officielle : https://developers.cloudflare.com/workers-ai/platform/pricing/
2. Depuis cette branche, lancer `node --test tests/*.mjs`, puis `node server/build.mjs`.
3. Dans un terminal de confiance, lancer `npx wrangler@4 login`, puis `npx wrangler@4 deploy`. Le nom du Worker est kim-english-preview. Sans mot de passe configuré, il refuse tout accès.
4. Lancer `npx wrangler@4 secret put KIM_PASSWORD` et saisir un long mot de passe personnel aléatoire en caractères ASCII. Aucun jeton fournisseur dans le navigateur. Safari demande le nom kim et ce mot de passe personnel.
5. Ouvrir l’adresse HTTPS fournie par Wrangler sur l’iPhone. Poser une question personnelle puis une relance, traduire la réponse, écouter les deux langues et dicter dans chacune. Vérifier les révisions après rechargement. Garder la branche principale distincte jusqu’à cette validation.

Le quota gratuit est partagé avec les autres usages du compte. Une indisponibilité ou une réponse modèle mal formée fait basculer le tour en exercice guidé. Aucune redirection vers un fournisseur payant.
