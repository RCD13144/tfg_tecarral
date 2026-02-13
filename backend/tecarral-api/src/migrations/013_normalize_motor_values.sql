BEGIN;

CREATE EXTENSION IF NOT EXISTS unaccent;

UPDATE maquina
SET motor =
    CASE

        WHEN lower(unaccent(motor)) LIKE 'diesel%' THEN 'Diésel'
        WHEN lower(unaccent(motor)) LIKE 'diesel/aut%' THEN 'Diésel'
        WHEN lower(unaccent(motor)) LIKE 'dies%' THEN 'Diésel'

        WHEN lower(unaccent(motor)) LIKE 'electrica%' THEN 'Eléctrica'
        WHEN lower(unaccent(motor)) LIKE 'electrico%' THEN 'Eléctrica'
        WHEN lower(unaccent(motor)) LIKE 'electrica 3f%' THEN 'Eléctrica'
        WHEN lower(unaccent(motor)) LIKE 'electric%' THEN 'Eléctrica'

        WHEN lower(unaccent(motor)) LIKE 'semi electr%' THEN 'Semi eléctrica'
        WHEN lower(unaccent(motor)) LIKE 'semi elect%' THEN 'Semi eléctrica'
        WHEN lower(unaccent(motor)) LIKE 'semi%' AND lower(unaccent(motor)) LIKE '%elect%' THEN 'Semi eléctrica'

        WHEN lower(unaccent(motor)) LIKE 'manual%' THEN 'Manual'

        ELSE motor
    END;

ALTER TABLE maquina
DROP CONSTRAINT IF EXISTS maquina_motor_check;

ALTER TABLE maquina
ADD CONSTRAINT maquina_motor_check
CHECK (
    motor IN ('Diésel', 'Eléctrica', 'Manual', 'Semi eléctrica')
);

CREATE INDEX IF NOT EXISTS maquina_motor_idx
ON maquina (motor);

COMMIT;
