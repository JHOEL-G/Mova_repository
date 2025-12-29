/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Home,
  Briefcase,
  Users,
  Landmark,
  AlertCircle,
} from "lucide-react";
import { globalApi } from "../../services/globalApi";
import { useNavigate, useParams } from "react-router";

export default function FormularioCompleto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [colonias, setColonias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [listaParentescos, setListaParentescos] = useState([]);
  const [listaBancos, setListaBancos] = useState([]);
  const [erroresValidacion, setErroresValidacion] = useState([]); // ← AGREGAR ESTA LÍNEA

  const [formData, setFormData] = useState({
    calle: "",
    numExterior: "",
    numInterior: "",
    codigoPostal: "",
    colonia: "",
    ciudad: "",
    municipio: "",
    estado: "",
    rfc: "",
    correo: "",
    empresa: "",
    telefonoEmpresa: "",
    antiguedadLaboral: "",
    ingresosMensuales: "",
    datosBancarios: "debito",
    banco: "",
    numeroTarjeta: "",
    confirmarTarjeta: "",
  });

  const [referencias, setReferencias] = useState([
    {
      id: 1,
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      telefono: "",
      parentesco: "",
      tiempoConocido: "",
    },
    {
      id: 2,
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      telefono: "",
      parentesco: "",
      tiempoConocido: "",
    },
  ]);

  const [beneficiarios, setBeneficiarios] = useState([
    {
      id: 1,
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      parentesco: "",
      porcentaje: "100",
      fechaNacimiento: "",
    },
  ]);

  const validarFormulario = () => {
    const errores = [];

    // Validar Domicilio
    if (!formData.calle.trim()) errores.push("La calle es obligatoria");
    if (!formData.numExterior.trim())
      errores.push("El número exterior es obligatorio");
    if (!formData.codigoPostal.trim() || formData.codigoPostal.length !== 5) {
      errores.push("El código postal debe tener 5 dígitos");
    }
    if (!formData.colonia.trim()) errores.push("Debe seleccionar una colonia");
    if (!formData.rfc.trim()) errores.push("El RFC es obligatorio");
    if (!formData.correo.trim()) {
      errores.push("El correo electrónico es obligatorio");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      errores.push("El correo electrónico no es válido");
    }

    // Validar Datos Laborales
    if (!formData.empresa.trim())
      errores.push("El nombre de la empresa es obligatorio");
    if (!formData.telefonoEmpresa.trim())
      errores.push("El teléfono de la empresa es obligatorio");
    if (!formData.antiguedadLaboral || formData.antiguedadLaboral <= 0) {
      errores.push("La antigüedad laboral debe ser mayor a 0");
    }
    if (!formData.ingresosMensuales || formData.ingresosMensuales <= 0) {
      errores.push("Los ingresos mensuales deben ser mayores a 0");
    }

    // Validar Referencias
    referencias.forEach((ref, index) => {
      if (!ref.nombre.trim())
        errores.push(`Referencia ${index + 1}: falta el nombre`);
      if (!ref.apellidoPaterno.trim())
        errores.push(`Referencia ${index + 1}: falta el apellido paterno`);
      if (!ref.telefono.trim())
        errores.push(`Referencia ${index + 1}: falta el teléfono`);
      if (!ref.parentesco)
        errores.push(`Referencia ${index + 1}: debe seleccionar un parentesco`);
      if (!ref.tiempoConocido || ref.tiempoConocido <= 0) {
        errores.push(
          `Referencia ${index + 1}: el tiempo de conocerse debe ser mayor a 0`
        );
      }
    });

    // Validar Beneficiarios
    beneficiarios.forEach((ben, index) => {
      if (!ben.nombre.trim())
        errores.push(`Beneficiario ${index + 1}: falta el nombre`);
      if (!ben.apellidoPaterno.trim())
        errores.push(`Beneficiario ${index + 1}: falta el apellido paterno`);
      if (!ben.parentesco)
        errores.push(
          `Beneficiario ${index + 1}: debe seleccionar un parentesco`
        );
      if (!ben.fechaNacimiento)
        errores.push(`Beneficiario ${index + 1}: falta la fecha de nacimiento`);
    });

    // Validar Datos Bancarios
    if (formData.datosBancarios === "debito") {
      if (
        !formData.numeroTarjeta.trim() ||
        formData.numeroTarjeta.length !== 16
      ) {
        errores.push("El número de tarjeta debe tener 16 dígitos");
      }
      if (
        !formData.confirmarTarjeta.trim() ||
        formData.confirmarTarjeta.length !== 16
      ) {
        errores.push("Debe confirmar el número de tarjeta (16 dígitos)");
      }
      if (formData.numeroTarjeta !== formData.confirmarTarjeta) {
        errores.push("Los números de tarjeta no coinciden");
      }
      if (!formData.banco.trim()) errores.push("Debe seleccionar un banco");
    }

    return errores;
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;

    if (name === "colonia") {
      const coloniaSeleccionada = colonias.find(
        (c) => c.asentamientoNombre === value
      );
      setFormData((prev) => ({
        ...prev,
        colonia: value,
        asentamientoId: coloniaSeleccionada
          ? coloniaSeleccionada.asentamientoId
          : "",
      }));
    } else if (name === "banco") {
      const bancoSeleccionado = listaBancos.find(
        (b) => b.bancoNombre === value
      );
      setFormData((prev) => ({
        ...prev,
        banco: value,
        claveBanco: bancoSeleccionado ? bancoSeleccionado.claveBanco : "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (name === "codigoPostal" && value.length === 5) {
      try {
        const response = await globalApi.consultarCP(value);
        const data = response.data;
        if (data && data.length > 0) {
          const primeraColonia = data[0];
          setFormData((prev) => ({
            ...prev,
            ciudad: primeraColonia.ciudad,
            municipio: primeraColonia.municipio,
            estado: primeraColonia.estado,
            colonia: data.length === 1 ? primeraColonia.asentamientoNombre : "",
            asentamientoId:
              data.length === 1 ? primeraColonia.asentamientoId : "",
          }));
          setColonias(data);
        }
      } catch (error) {
        console.error("Error al buscar CP", error);
      }
    }
  };

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [resParentesco, resBancos] = await Promise.all([
          globalApi.consultarParentescos(),
          globalApi.consultarBancos(),
        ]);

        const dataP = Array.isArray(resParentesco.data)
          ? resParentesco.data
          : resParentesco.data?.data || [];

        const dataB = Array.isArray(resBancos.data)
          ? resBancos.data
          : resBancos.data?.data || [];

        setListaParentescos(dataP);
        setListaBancos(dataB);
      } catch (error) {
        console.error("Error cargando catálogos", error);
        setListaParentescos([]);
        setListaBancos([]);
      }
    };
    cargarCatalogos();
  }, []);

  const handleDynamicChange = (setter, id, field, value) => {
    setter((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addItem = (setter, emptyItem) => {
    setter((prev) => [
      ...prev,
      { ...emptyItem, id: Math.max(...prev.map((i) => i.id), 0) + 1 },
    ]);
  };

  const handleSubmit = async () => {
    const errores = validarFormulario();
    if (errores.length > 0) {
      setErroresValidacion(errores);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setErroresValidacion([]);
    setCargando(true);
    try {
      const payloadFinal = {
        direccion: {
          calle: formData.calle || "",
          numExterior: formData.numExterior || "",
          numInterior: formData.numInterior || "",
          codigoPostal: Number(formData.codigoPostal) || 0,
          asentamientoId: formData.asentamientoId
            ? String(formData.asentamientoId).replace(/^0+/, "")
            : "947",
          ciudad: formData.ciudad || "",
          municipo: formData.municipio || "",
          estado: formData.estado || "",
          rfc: formData.rfc || "",
          correo: formData.correo || "",
        },
        referencias: referencias.map((r) => ({
          nombres: r.nombre || "",
          apellidoPaterno: r.apellidoPaterno || "",
          apellidoMaterno: r.apellidoMaterno || "",
          telefono: String(r.telefono || "").replace(/\s/g, ""),
          tiempoConocido: Number(r.tiempoConocido) || 1,
          parentescoId: Number(r.parentescoId) || 1,
        })),
        beneficiarios: beneficiarios.map((b) => ({
          porcentajeDestinado: parseFloat("1.0"),
          nombres: b.nombre || "",
          apellidoPaterno: b.apellidoPaterno || "",
          apellidoMaterno: b.apellidoMaterno || "",
          parentescoId: Number(b.parentescoId) || 1,
          fechaNacimiento: b.fechaNacimiento || "2000-01-01",
        })),
        laborales: {
          empresa: formData.empresa || "",
          telefono: String(formData.telefonoEmpresa || ""),
          antiguedad: Number(formData.antiguedadLaboral) || 1,
          ingresosMenusales: parseFloat("500.0"),
        },
        tarjeta: {
          numTarjeta: String(formData.numeroTarjeta || ""),
          numTarjetaConf: String(formData.confirmarTarjeta || ""),
          banco:
            Number(formData.claveBanco) > 0
              ? Number(formData.claveBanco)
              : 2001,
        },
        referencia: id,
      };

      console.log("📦 Payload Final validado:", payloadFinal);
      console.log(
        "📦 Payload como JSON:",
        JSON.stringify(payloadFinal, null, 2)
      );

      const response = await globalApi.registrarFormulario(payloadFinal);

      console.log("✅ Respuesta del servidor:", response.data);

      if (response.data?.error === 0) {
        alert("¡Registro exitoso!");
        navigate(`/captura-ine/${id}`);
      } else {
        alert(
          "Error del servidor: " + (response.data?.resultado || "Desconocido")
        );
      }
    } catch (error) {
      console.error("❌ Error completo:", error.response?.data);

      if (error.response?.data?.errors) {
        const errores = error.response.data.errors;
        console.error("📋 Errores de validación:", errores);

        const mensajesError = Object.entries(errores)
          .map(
            ([campo, mensajes]) =>
              `• ${campo}: ${
                Array.isArray(mensajes) ? mensajes.join(", ") : mensajes
              }`
          )
          .join("\n");

        alert(`Errores de validación:\n\n${mensajesError}`);
      } else {
        alert("Error de comunicación. Revisa tu conexión.");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white px-6 py-4 flex items-center justify-between border-b shadow-sm sticky top-0 z-20">
        <div className="text-orange-500 text-2xl font-bold italic">
          m~
          <span className="text-slate-800 not-italic font-semibold ml-1">
            mova
          </span>
        </div>
        <span className="text-slate-400 text-xs font-mono">v 1.24.23.0</span>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <p className="text-slate-500 text-sm mb-6">
            Por favor, capture la información solicitada a continuación.
          </p>

          {erroresValidacion.length > 0 && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    Campos incompletos
                  </h3>
                  <p className="text-gray-600 mb-8">
                    Completa todos los campos marcados con{" "}
                    <span className="text-red-500 font-bold text-lg">*</span>{" "}
                    para continuar
                  </p>
                  <button
                    onClick={() => setErroresValidacion([])}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DOMICILIO Y PERSONALES */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
              <Home size={18} className="text-indigo-600" />
              <h2 className="font-semibold text-slate-700 uppercase text-sm tracking-wider">
                Domicilio y Personales
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Calle *
                </label>
                <input
                  type="text"
                  name="calle"
                  value={formData.calle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Núm. exterior *
                </label>
                <input
                  type="text"
                  name="numExterior"
                  value={formData.numExterior}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Núm. interior
                </label>
                <input
                  type="text"
                  name="numInterior"
                  value={formData.numInterior}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 text-orange-600 font-bold">
                  Código postal *
                </label>
                <input
                  type="text"
                  name="codigoPostal"
                  maxLength={5}
                  value={formData.codigoPostal}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-orange-200 bg-orange-50 rounded-lg font-bold outline-none"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Colonia *
                </label>
                <select
                  name="colonia"
                  value={formData.colonia}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">Seleccione colonia</option>
                  {colonias.map((c, i) => (
                    <option key={i} value={c.asentamientoNombre}>
                      {c.asentamientoNombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={formData.ciudad}
                  readOnly
                  className="w-full px-3 py-2 border bg-slate-50 rounded-lg text-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Municipio
                </label>
                <input
                  type="text"
                  value={formData.municipio}
                  readOnly
                  className="w-full px-3 py-2 border bg-slate-50 rounded-lg text-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Estado
                </label>
                <input
                  type="text"
                  value={formData.estado}
                  readOnly
                  className="w-full px-3 py-2 border bg-slate-50 rounded-lg text-slate-500"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  RFC *
                </label>
                <input
                  type="text"
                  name="rfc"
                  value={formData.rfc}
                  onChange={handleInputChange}
                  maxLength={13}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase"
                  placeholder="10 o 13 caracteres"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* DATOS LABORALES */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
              <Briefcase size={18} className="text-indigo-600" />
              <h2 className="font-semibold text-slate-700 uppercase text-sm tracking-wider">
                Datos Laborales
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Empresa o Emprendimiento *
                </label>
                <input
                  type="text"
                  name="empresa"
                  value={formData.empresa}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Teléfono de la empresa *
                </label>
                <input
                  type="text"
                  name="telefonoEmpresa"
                  value={formData.telefonoEmpresa}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 10) handleInputChange(e);
                  }}
                  maxLength={10}
                  placeholder="10 dígitos sin formato"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Antigüedad laboral (años) *
                </label>
                <input
                  type="number"
                  name="antiguedadLaboral"
                  value={formData.antiguedadLaboral}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Ingresos mensuales *
                </label>
                <input
                  type="number"
                  name="ingresosMensuales"
                  value={formData.ingresosMensuales}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* REFERENCIAS */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                <h2 className="font-semibold text-slate-700 uppercase text-sm tracking-wider">
                  Referencias
                </h2>
              </div>
              <button
                onClick={() =>
                  addItem(setReferencias, {
                    nombre: "",
                    apellidoPaterno: "",
                    apellidoMaterno: "",
                    telefono: "",
                    parentescoId: "",
                    tiempoConocido: "0",
                  })
                }
                className="p-1 hover:bg-indigo-100 rounded-full text-indigo-600 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {" "}
              {/* Aumenté el espacio entre referencias */}
              {referencias.map((ref, index) => (
                <div key={ref.id} className="relative pb-4 last:pb-0">
                  {" "}
                  {/* Eliminado el borde y fondo gris de aquí */}
                  {referencias.length > 1 && (
                    <button
                      onClick={() =>
                        setReferencias((prev) =>
                          prev.filter((r) => r.id !== ref.id)
                        )
                      }
                      className="absolute top-0 right-0 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <p className="text-[10px] font-bold text-indigo-400 uppercase mb-3">
                    Referencia {index + 1}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nombre(s) *"
                      className="p-2 border-b border-slate-200 focus:border-indigo-500 outline-none bg-transparent"
                      value={ref.nombre}
                      onChange={(e) =>
                        handleDynamicChange(
                          setReferencias,
                          ref.id,
                          "nombre",
                          e.target.value
                        )
                      }
                    />
                    <input
                      type="text"
                      placeholder="Apellido Paterno *"
                      className="p-2 border-b border-slate-200 focus:border-indigo-500 outline-none bg-transparent"
                      value={ref.apellidoPaterno}
                      onChange={(e) =>
                        handleDynamicChange(
                          setReferencias,
                          ref.id,
                          "apellidoPaterno",
                          e.target.value
                        )
                      }
                    />
                    <input
                      type="text"
                      placeholder="Apellido Materno *"
                      className="p-2 border-b border-slate-200 focus:border-indigo-500 outline-none bg-transparent"
                      value={ref.apellidoMaterno}
                      onChange={(e) =>
                        handleDynamicChange(
                          setReferencias,
                          ref.id,
                          "apellidoMaterno",
                          e.target.value
                        )
                      }
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Teléfono (10 dígitos) *"
                        className="p-2 border-b border-slate-200 focus:border-indigo-500 outline-none bg-transparent"
                        value={ref.telefono}
                        maxLength={10}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          handleDynamicChange(
                            setReferencias,
                            ref.id,
                            "telefono",
                            val
                          );
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Años conocido"
                        className="p-2 border-b border-slate-200 focus:border-indigo-500 outline-none bg-transparent text-sm"
                        value={ref.tiempoConocido}
                        onChange={(e) =>
                          handleDynamicChange(
                            setReferencias,
                            ref.id,
                            "tiempoConocido",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <select
                      className="w-full p-2 border-b border-slate-200 focus:border-indigo-500 outline-none bg-transparent text-sm"
                      value={ref.parentesco}
                      onChange={(e) => {
                        const pSeleccionado = listaParentescos.find(
                          (p) => p.parentescoNombre === e.target.value
                        );
                        handleDynamicChange(
                          setReferencias,
                          ref.id,
                          "parentesco",
                          e.target.value
                        );
                        handleDynamicChange(
                          setReferencias,
                          ref.id,
                          "parentescoId",
                          pSeleccionado?.parentescoId || 1
                        );
                      }}
                    >
                      <option value="">Seleccione parentesco</option>
                      {Array.isArray(listaParentescos) &&
                        listaParentescos.map((p) => (
                          <option
                            key={p.parentescoId}
                            value={p.parentescoNombre}
                          >
                            {p.parentescoNombre || p.descripcion}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BENEFICIARIOS */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                <h2 className="font-semibold text-slate-700 uppercase text-sm tracking-wider">
                  Beneficiarios
                </h2>
              </div>
              <button
                onClick={() =>
                  addItem(setBeneficiarios, {
                    nombre: "",
                    apellidoPaterno: "",
                    apellidoMaterno: "",
                    parentesco: "",
                    porcentaje: "100",
                    fechaNacimiento: "",
                  })
                }
                className="p-1 hover:bg-indigo-100 rounded-full text-indigo-600 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {beneficiarios.map((ben, index) => (
                <div key={ben.id} className="relative pb-4 last:pb-0">
                  {" "}
                  {/* Eliminado el borde y fondo azul de aquí */}
                  <p className="text-[10px] font-bold text-indigo-400 uppercase mb-3">
                    Beneficiario {index + 1}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nombre(s) *"
                      className="p-2 border-b border-slate-200 focus:border-indigo-500 outline-none bg-transparent"
                      value={ben.nombre}
                      onChange={(e) =>
                        handleDynamicChange(
                          setBeneficiarios,
                          ben.id,
                          "nombre",
                          e.target.value
                        )
                      }
                    />
                    <input
                      type="text"
                      placeholder="Apellido Paterno *"
                      className="p-2 border-b border-slate-200 focus:border-indigo-500 outline-none bg-transparent"
                      value={ben.apellidoPaterno}
                      onChange={(e) =>
                        handleDynamicChange(
                          setBeneficiarios,
                          ben.id,
                          "apellidoPaterno",
                          e.target.value
                        )
                      }
                    />
                    <div className="flex gap-2">
                      <select
                        className="w-full p-2 border-b border-slate-200 focus:border-indigo-500 outline-none bg-transparent text-sm"
                        value={ben.parentesco}
                        onChange={(e) => {
                          const pSeleccionado = listaParentescos.find(
                            (p) => p.parentescoNombre === e.target.value
                          );

                          handleDynamicChange(
                            setBeneficiarios,
                            ben.id,
                            "parentesco",
                            e.target.value
                          );

                          handleDynamicChange(
                            setBeneficiarios,
                            ben.id,
                            "parentescoId",
                            pSeleccionado?.parentescoId || 1
                          );
                        }}
                      >
                        <option value="">Seleccione parentesco</option>
                        {Array.isArray(listaParentescos) &&
                          listaParentescos.map((p) => (
                            <option
                              key={p.parentescoId}
                              value={p.parentescoNombre}
                            >
                              {p.parentescoNombre || p.descripcion}
                            </option>
                          ))}
                      </select>
                    </div>
                    <input
                      type="date"
                      className="p-2 border-b border-slate-200 focus:border-indigo-500 outline-none bg-transparent text-sm"
                      value={ben.fechaNacimiento}
                      onChange={(e) =>
                        handleDynamicChange(
                          setBeneficiarios,
                          ben.id,
                          "fechaNacimiento",
                          e.target.value
                        )
                      }
                    />
                    <input
                      type="number"
                      placeholder="Porcentaje %"
                      className="p-2 border-b border-slate-200 focus:border-indigo-500 outline-none bg-transparent"
                      value={ben.porcentaje}
                      onChange={(e) =>
                        handleDynamicChange(
                          setBeneficiarios,
                          ben.id,
                          "porcentaje",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DATOS BANCARIOS */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Landmark size={18} className="text-indigo-600" />
              <h2 className="font-semibold text-slate-700 uppercase text-sm tracking-wider">
                Datos bancarios
              </h2>
            </div>

            {/* Selección de Tipo de Cobro */}
            <div className="flex gap-6 mb-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="datosBancarios"
                  value="debito"
                  checked={formData.datosBancarios === "debito"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm text-slate-600 group-hover:text-indigo-600 font-medium">
                  Tarjeta de débito
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="datosBancarios"
                  value="sin_tarjeta"
                  checked={formData.datosBancarios === "sin_tarjeta"}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-indigo-600"
                />
                <span className="text-sm text-slate-600 group-hover:text-indigo-600 font-medium">
                  Retiro sin tarjeta
                </span>
              </label>
            </div>

            {/* Panel Detalle de Tarjeta (Solo visible si es débito) */}
            {formData.datosBancarios === "debito" && (
              <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/50 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[10px] font-bold text-indigo-500 uppercase mb-4 tracking-widest">
                  Detalles de la Tarjeta
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Número de Tarjeta */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Número de tarjeta *
                    </label>
                    <input
                      type="text"
                      name="numeroTarjeta"
                      maxLength={16}
                      placeholder="XXXX XXXX XXXX XXXX"
                      value={formData.numeroTarjeta}
                      onChange={handleInputChange}
                      className="w-full p-2 border-b border-slate-200 focus:border-indigo-500 outline-none bg-transparent text-sm font-mono tracking-widest"
                    />
                  </div>

                  {/* Confirmar Tarjeta */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Confirme su tarjeta *
                    </label>
                    <input
                      type="text"
                      name="confirmarTarjeta"
                      maxLength={16}
                      placeholder="XXXX XXXX XXXX XXXX"
                      value={formData.confirmarTarjeta}
                      onChange={handleInputChange}
                      className="w-full p-2 border-b border-slate-200 focus:border-indigo-500 outline-none bg-transparent text-sm font-mono tracking-widest"
                    />
                  </div>

                  {/* Selector de Banco Dinámico */}
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Banco *
                    </label>
                    <select
                      name="banco"
                      value={formData.banco}
                      onChange={handleInputChange}
                      className="w-full p-2 border-b border-slate-200 focus:border-indigo-500 outline-none bg-transparent text-sm"
                    >
                      <option value="">Seleccione banco</option>
                      {Array.isArray(listaBancos) &&
                        listaBancos.map((b) => (
                          <option
                            key={b.claveBanco || b.id}
                            value={b.bancoNombre}
                          >
                            {b.bancoNombre}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Alerta visual si no coinciden (opcional) */}
                {formData.numeroTarjeta &&
                  formData.confirmarTarjeta &&
                  formData.numeroTarjeta !== formData.confirmarTarjeta && (
                    <p className="text-[10px] text-red-500 mt-2 font-medium">
                      Los números de tarjeta no coinciden.
                    </p>
                  )}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={handleSubmit}
              disabled={cargando}
              className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
                cargando
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
              }`}
            >
              {cargando ? "Enviando..." : "Continuar registro"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
