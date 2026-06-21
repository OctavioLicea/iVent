--
-- PostgreSQL database dump
--

\restrict 4VP0bL7DMJ1moHtMcE6ENHtHV5UCHgYivPmIocPPXB1DGTLEVZV6O6w7c8R965Q

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: tuasesor; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA tuasesor;


ALTER SCHEMA tuasesor OWNER TO postgres;

--
-- Name: bloquear_visita_sin_nombre(); Type: FUNCTION; Schema: tuasesor; Owner: postgres
--

CREATE FUNCTION tuasesor.bloquear_visita_sin_nombre() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  if (select nombre from tuasesor.contactos where id = new.contacto_id) is null then
    raise exception 'No se puede agendar una visita: el contacto no tiene nombre identificado.';
  end if;
  return new;
end;
$$;


ALTER FUNCTION tuasesor.bloquear_visita_sin_nombre() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contacto_propiedades; Type: TABLE; Schema: tuasesor; Owner: postgres
--

CREATE TABLE tuasesor.contacto_propiedades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contacto_id uuid NOT NULL,
    propiedad_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE tuasesor.contacto_propiedades OWNER TO postgres;

--
-- Name: contactos; Type: TABLE; Schema: tuasesor; Owner: postgres
--

CREATE TABLE tuasesor.contactos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    telefono text NOT NULL,
    nombre text,
    nota_sin_propiedad text,
    etapa text DEFAULT 'nuevo'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contactos_etapa_check CHECK ((etapa = ANY (ARRAY['nuevo'::text, 'calificacion'::text, 'interesado'::text, 'en_proceso_cierre'::text, 'cerrado'::text, 'perdido'::text])))
);


ALTER TABLE tuasesor.contactos OWNER TO postgres;

--
-- Name: fotos_propiedad; Type: TABLE; Schema: tuasesor; Owner: postgres
--

CREATE TABLE tuasesor.fotos_propiedad (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    propiedad_id uuid NOT NULL,
    storage_path text NOT NULL,
    lat numeric,
    lng numeric,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE tuasesor.fotos_propiedad OWNER TO postgres;

--
-- Name: interacciones; Type: TABLE; Schema: tuasesor; Owner: postgres
--

CREATE TABLE tuasesor.interacciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    contacto_id uuid NOT NULL,
    propiedad_id uuid,
    canal text NOT NULL,
    direccion text NOT NULL,
    fuente text,
    nota text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT interacciones_canal_check CHECK ((canal = ANY (ARRAY['whatsapp'::text, 'llamada'::text, 'otro'::text]))),
    CONSTRAINT interacciones_direccion_check CHECK ((direccion = ANY (ARRAY['entrante'::text, 'saliente'::text]))),
    CONSTRAINT interacciones_fuente_check CHECK ((fuente = ANY (ARRAY['letrero'::text, 'facebook'::text, 'instagram'::text, 'tiktok'::text, 'recomendacion'::text, 'otro'::text])))
);


ALTER TABLE tuasesor.interacciones OWNER TO postgres;

--
-- Name: propiedad_colaboradores; Type: TABLE; Schema: tuasesor; Owner: postgres
--

CREATE TABLE tuasesor.propiedad_colaboradores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    propiedad_id uuid NOT NULL,
    contacto_id uuid NOT NULL,
    rol text NOT NULL,
    rol_otro text,
    porcentaje_comision numeric,
    notas text,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT propiedad_colaboradores_rol_check CHECK ((rol = ANY (ARRAY['vendedor'::text, 'comprador_interesado'::text, 'arrendador'::text, 'arrendatario'::text, 'asesor_colaborador'::text, 'notario'::text, 'ejecutivo_bancario'::text, 'agencia_investigacion'::text, 'proveedor'::text, 'otro'::text])))
);


ALTER TABLE tuasesor.propiedad_colaboradores OWNER TO postgres;

--
-- Name: propiedades; Type: TABLE; Schema: tuasesor; Owner: postgres
--

CREATE TABLE tuasesor.propiedades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    tipo text NOT NULL,
    operacion text NOT NULL,
    uso text NOT NULL,
    zona text NOT NULL,
    precio numeric,
    estado text DEFAULT 'captacion'::text NOT NULL,
    ficha_completa boolean DEFAULT false NOT NULL,
    ficha jsonb DEFAULT '{}'::jsonb NOT NULL,
    url_facebook text,
    url_instagram text,
    url_tiktok text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT propiedades_estado_check CHECK ((estado = ANY (ARRAY['captacion'::text, 'disponible'::text, 'en_proceso'::text, 'cerrada'::text]))),
    CONSTRAINT propiedades_operacion_check CHECK ((operacion = ANY (ARRAY['venta'::text, 'renta'::text]))),
    CONSTRAINT propiedades_tipo_check CHECK ((tipo = ANY (ARRAY['casa'::text, 'departamento'::text, 'terreno'::text, 'local'::text, 'otro'::text]))),
    CONSTRAINT propiedades_uso_check CHECK ((uso = ANY (ARRAY['residencial'::text, 'comercial'::text]))),
    CONSTRAINT propiedades_zona_check CHECK ((zona = ANY (ARRAY['saltillo'::text, 'arteaga'::text, 'ramos_arizpe'::text])))
);


ALTER TABLE tuasesor.propiedades OWNER TO postgres;

--
-- Name: visitas; Type: TABLE; Schema: tuasesor; Owner: postgres
--

CREATE TABLE tuasesor.visitas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    contacto_id uuid NOT NULL,
    propiedad_id uuid NOT NULL,
    fecha timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE tuasesor.visitas OWNER TO postgres;

--
-- Data for Name: contacto_propiedades; Type: TABLE DATA; Schema: tuasesor; Owner: postgres
--

COPY tuasesor.contacto_propiedades (id, contacto_id, propiedad_id, created_at) FROM stdin;
\.


--
-- Data for Name: contactos; Type: TABLE DATA; Schema: tuasesor; Owner: postgres
--

COPY tuasesor.contactos (id, user_id, telefono, nombre, nota_sin_propiedad, etapa, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: fotos_propiedad; Type: TABLE DATA; Schema: tuasesor; Owner: postgres
--

COPY tuasesor.fotos_propiedad (id, propiedad_id, storage_path, lat, lng, created_at) FROM stdin;
\.


--
-- Data for Name: interacciones; Type: TABLE DATA; Schema: tuasesor; Owner: postgres
--

COPY tuasesor.interacciones (id, user_id, contacto_id, propiedad_id, canal, direccion, fuente, nota, created_at) FROM stdin;
\.


--
-- Data for Name: propiedad_colaboradores; Type: TABLE DATA; Schema: tuasesor; Owner: postgres
--

COPY tuasesor.propiedad_colaboradores (id, propiedad_id, contacto_id, rol, rol_otro, porcentaje_comision, notas, activo, created_at) FROM stdin;
\.


--
-- Data for Name: propiedades; Type: TABLE DATA; Schema: tuasesor; Owner: postgres
--

COPY tuasesor.propiedades (id, user_id, tipo, operacion, uso, zona, precio, estado, ficha_completa, ficha, url_facebook, url_instagram, url_tiktok, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: visitas; Type: TABLE DATA; Schema: tuasesor; Owner: postgres
--

COPY tuasesor.visitas (id, user_id, contacto_id, propiedad_id, fecha, created_at) FROM stdin;
\.


--
-- Name: contacto_propiedades contacto_propiedades_contacto_id_propiedad_id_key; Type: CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.contacto_propiedades
    ADD CONSTRAINT contacto_propiedades_contacto_id_propiedad_id_key UNIQUE (contacto_id, propiedad_id);


--
-- Name: contacto_propiedades contacto_propiedades_pkey; Type: CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.contacto_propiedades
    ADD CONSTRAINT contacto_propiedades_pkey PRIMARY KEY (id);


--
-- Name: contactos contactos_pkey; Type: CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.contactos
    ADD CONSTRAINT contactos_pkey PRIMARY KEY (id);


--
-- Name: contactos contactos_user_id_telefono_key; Type: CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.contactos
    ADD CONSTRAINT contactos_user_id_telefono_key UNIQUE (user_id, telefono);


--
-- Name: fotos_propiedad fotos_propiedad_pkey; Type: CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.fotos_propiedad
    ADD CONSTRAINT fotos_propiedad_pkey PRIMARY KEY (id);


--
-- Name: interacciones interacciones_pkey; Type: CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.interacciones
    ADD CONSTRAINT interacciones_pkey PRIMARY KEY (id);


--
-- Name: propiedad_colaboradores propiedad_colaboradores_pkey; Type: CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.propiedad_colaboradores
    ADD CONSTRAINT propiedad_colaboradores_pkey PRIMARY KEY (id);


--
-- Name: propiedades propiedades_pkey; Type: CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.propiedades
    ADD CONSTRAINT propiedades_pkey PRIMARY KEY (id);


--
-- Name: visitas visitas_pkey; Type: CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.visitas
    ADD CONSTRAINT visitas_pkey PRIMARY KEY (id);


--
-- Name: visitas trg_bloquear_visita_sin_nombre; Type: TRIGGER; Schema: tuasesor; Owner: postgres
--

CREATE TRIGGER trg_bloquear_visita_sin_nombre BEFORE INSERT ON tuasesor.visitas FOR EACH ROW EXECUTE FUNCTION tuasesor.bloquear_visita_sin_nombre();


--
-- Name: contacto_propiedades contacto_propiedades_contacto_id_fkey; Type: FK CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.contacto_propiedades
    ADD CONSTRAINT contacto_propiedades_contacto_id_fkey FOREIGN KEY (contacto_id) REFERENCES tuasesor.contactos(id) ON DELETE CASCADE;


--
-- Name: contacto_propiedades contacto_propiedades_propiedad_id_fkey; Type: FK CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.contacto_propiedades
    ADD CONSTRAINT contacto_propiedades_propiedad_id_fkey FOREIGN KEY (propiedad_id) REFERENCES tuasesor.propiedades(id) ON DELETE CASCADE;


--
-- Name: contactos contactos_user_id_fkey; Type: FK CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.contactos
    ADD CONSTRAINT contactos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: fotos_propiedad fotos_propiedad_propiedad_id_fkey; Type: FK CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.fotos_propiedad
    ADD CONSTRAINT fotos_propiedad_propiedad_id_fkey FOREIGN KEY (propiedad_id) REFERENCES tuasesor.propiedades(id) ON DELETE CASCADE;


--
-- Name: interacciones interacciones_contacto_id_fkey; Type: FK CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.interacciones
    ADD CONSTRAINT interacciones_contacto_id_fkey FOREIGN KEY (contacto_id) REFERENCES tuasesor.contactos(id) ON DELETE CASCADE;


--
-- Name: interacciones interacciones_propiedad_id_fkey; Type: FK CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.interacciones
    ADD CONSTRAINT interacciones_propiedad_id_fkey FOREIGN KEY (propiedad_id) REFERENCES tuasesor.propiedades(id);


--
-- Name: interacciones interacciones_user_id_fkey; Type: FK CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.interacciones
    ADD CONSTRAINT interacciones_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: propiedad_colaboradores propiedad_colaboradores_contacto_id_fkey; Type: FK CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.propiedad_colaboradores
    ADD CONSTRAINT propiedad_colaboradores_contacto_id_fkey FOREIGN KEY (contacto_id) REFERENCES tuasesor.contactos(id) ON DELETE CASCADE;


--
-- Name: propiedad_colaboradores propiedad_colaboradores_propiedad_id_fkey; Type: FK CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.propiedad_colaboradores
    ADD CONSTRAINT propiedad_colaboradores_propiedad_id_fkey FOREIGN KEY (propiedad_id) REFERENCES tuasesor.propiedades(id) ON DELETE CASCADE;


--
-- Name: propiedades propiedades_user_id_fkey; Type: FK CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.propiedades
    ADD CONSTRAINT propiedades_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: visitas visitas_contacto_id_fkey; Type: FK CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.visitas
    ADD CONSTRAINT visitas_contacto_id_fkey FOREIGN KEY (contacto_id) REFERENCES tuasesor.contactos(id) ON DELETE CASCADE;


--
-- Name: visitas visitas_propiedad_id_fkey; Type: FK CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.visitas
    ADD CONSTRAINT visitas_propiedad_id_fkey FOREIGN KEY (propiedad_id) REFERENCES tuasesor.propiedades(id) ON DELETE CASCADE;


--
-- Name: visitas visitas_user_id_fkey; Type: FK CONSTRAINT; Schema: tuasesor; Owner: postgres
--

ALTER TABLE ONLY tuasesor.visitas
    ADD CONSTRAINT visitas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: contacto_propiedades; Type: ROW SECURITY; Schema: tuasesor; Owner: postgres
--

ALTER TABLE tuasesor.contacto_propiedades ENABLE ROW LEVEL SECURITY;

--
-- Name: contacto_propiedades contacto_propiedades_owner; Type: POLICY; Schema: tuasesor; Owner: postgres
--

CREATE POLICY contacto_propiedades_owner ON tuasesor.contacto_propiedades USING ((EXISTS ( SELECT 1
   FROM tuasesor.contactos c
  WHERE ((c.id = contacto_propiedades.contacto_id) AND (c.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM tuasesor.contactos c
  WHERE ((c.id = contacto_propiedades.contacto_id) AND (c.user_id = auth.uid())))));


--
-- Name: contactos; Type: ROW SECURITY; Schema: tuasesor; Owner: postgres
--

ALTER TABLE tuasesor.contactos ENABLE ROW LEVEL SECURITY;

--
-- Name: contactos contactos_owner; Type: POLICY; Schema: tuasesor; Owner: postgres
--

CREATE POLICY contactos_owner ON tuasesor.contactos USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: fotos_propiedad; Type: ROW SECURITY; Schema: tuasesor; Owner: postgres
--

ALTER TABLE tuasesor.fotos_propiedad ENABLE ROW LEVEL SECURITY;

--
-- Name: fotos_propiedad fotos_propiedad_owner; Type: POLICY; Schema: tuasesor; Owner: postgres
--

CREATE POLICY fotos_propiedad_owner ON tuasesor.fotos_propiedad USING ((EXISTS ( SELECT 1
   FROM tuasesor.propiedades p
  WHERE ((p.id = fotos_propiedad.propiedad_id) AND (p.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM tuasesor.propiedades p
  WHERE ((p.id = fotos_propiedad.propiedad_id) AND (p.user_id = auth.uid())))));


--
-- Name: interacciones; Type: ROW SECURITY; Schema: tuasesor; Owner: postgres
--

ALTER TABLE tuasesor.interacciones ENABLE ROW LEVEL SECURITY;

--
-- Name: interacciones interacciones_owner; Type: POLICY; Schema: tuasesor; Owner: postgres
--

CREATE POLICY interacciones_owner ON tuasesor.interacciones USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: propiedad_colaboradores; Type: ROW SECURITY; Schema: tuasesor; Owner: postgres
--

ALTER TABLE tuasesor.propiedad_colaboradores ENABLE ROW LEVEL SECURITY;

--
-- Name: propiedad_colaboradores propiedad_colaboradores_owner; Type: POLICY; Schema: tuasesor; Owner: postgres
--

CREATE POLICY propiedad_colaboradores_owner ON tuasesor.propiedad_colaboradores USING ((EXISTS ( SELECT 1
   FROM tuasesor.propiedades p
  WHERE ((p.id = propiedad_colaboradores.propiedad_id) AND (p.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM tuasesor.propiedades p
  WHERE ((p.id = propiedad_colaboradores.propiedad_id) AND (p.user_id = auth.uid())))));


--
-- Name: propiedades; Type: ROW SECURITY; Schema: tuasesor; Owner: postgres
--

ALTER TABLE tuasesor.propiedades ENABLE ROW LEVEL SECURITY;

--
-- Name: propiedades propiedades_owner; Type: POLICY; Schema: tuasesor; Owner: postgres
--

CREATE POLICY propiedades_owner ON tuasesor.propiedades USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: visitas; Type: ROW SECURITY; Schema: tuasesor; Owner: postgres
--

ALTER TABLE tuasesor.visitas ENABLE ROW LEVEL SECURITY;

--
-- Name: visitas visitas_owner; Type: POLICY; Schema: tuasesor; Owner: postgres
--

CREATE POLICY visitas_owner ON tuasesor.visitas USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- PostgreSQL database dump complete
--

\unrestrict 4VP0bL7DMJ1moHtMcE6ENHtHV5UCHgYivPmIocPPXB1DGTLEVZV6O6w7c8R965Q

