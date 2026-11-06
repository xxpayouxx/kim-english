# Kim V0.5 — branche de développement

Cette branche prépare l'intégration d'un service conversationnel. **La conversation IA n'est pas encore activée** : aucun serveur ni clé API n'est provisionné. La branche principale reste inchangée.

## Contrat de l'API

Le client envoie une requête HTTPS POST JSON à une URL de confiance configurée dans le navigateur :

```json
{"message":"How are you?","history":[{"role":"user","content":"Hello"}],"level":1}
```

Le serveur répond :

```json
{"reply":"I'm doing well! What made you smile today?","correction":""}
```

Pour un test développeur seulement, l'URL est définie par `localStorage.setItem('kim_api_endpoint', 'https://...')`. Ne pas ajouter de clé API au JavaScript ni au localStorage. Le service doit garder les clés côté serveur, contrôler l'origine CORS, limiter les requêtes, la longueur des messages, le budget mensuel et le nombre de tokens, et filtrer les entrées de l'historique. Les limites de dépenses du fournisseur doivent aussi être configurées indépendamment.

Sans URL configurée, ou si le service est indisponible, l'application conserve son mode d'exercices actuel. Le correcteur heuristique existant n'est pas une correction linguistique fiable : à remplacer lors de la mise en service du moteur IA.

## À faire avant publication

- Implémenter et tester un relais Cloudflare Worker et son secret API.
- Vérifier le tarif du modèle choisi, les plafonds de facturation et le consentement avant activation.
- Tester micro, audio et conversation sur Safari iOS.
- Tester les réponses et erreurs du serveur, l'accessibilité et la protection des données.
- Déployer après validation sur une branche de préproduction.

