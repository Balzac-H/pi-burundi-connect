-- Arija Connect — Assistant virtuel : interrupteur admin.
--
-- assistant_actif (true par defaut) permet de couper l'assistant sans
-- redeployer. Le réglage est public en lecture (comme les autres), mais seule
-- la fonction serveur (service_role) l'utilise pour autoriser les réponses.
--
-- Aucune migration existante n'est modifiée.

INSERT INTO public.reglages (cle, valeur)
VALUES ('assistant_actif', 'true'::jsonb)
ON CONFLICT (cle) DO NOTHING;
