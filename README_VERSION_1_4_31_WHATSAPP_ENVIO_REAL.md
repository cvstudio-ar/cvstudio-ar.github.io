# CVStudio v1.4.31 — WhatsApp envío real

Corrección aplicada sobre el ZIP entregado por el usuario (`cvstudio(2).zip`).

- El campo de Seguimiento ya no guarda notas internas.
- Enter y la flecha llaman exclusivamente a `whatsapp-admin-send`.
- El envío funciona aun si el cliente todavía no tiene `realRequestId`; el identificador es opcional.
- Si Meta acepta el mensaje, aparece inmediatamente en el historial sin recargar.
- Si el Worker o Meta rechazan el envío, se muestra el error y no se crea ninguna nota.
- Versión visible: v1.4.31.
