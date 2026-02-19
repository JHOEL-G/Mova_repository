import React from "react";
import {
    Home,
    Briefcase,
    Users,
    Landmark,
    CheckCircle,
    Edit,
    Send,
    AlertCircle,
} from "lucide-react";

export default function VerificarInformacion({
    formData,
    referencias,
    beneficiarios,
    listaBancos,
    listaParentescos,
    onConfirmar,
    onEditar,
    cargando,
}) {
    // Obtener nombre del banco seleccionado
    const obtenerNombreBanco = () => {
        if (!formData.banco) return "No especificado";
        const banco = listaBancos.find((b) => b.bancoNombre === formData.banco);
        return banco?.bancoNombre || formData.banco;
    };

    // Obtener nombre del parentesco por ID
    const obtenerNombreParentesco = (parentescoId) => {
        const parentesco = listaParentescos.find(
            (p) => p.parentescoId === parentescoId
        );
        return parentesco?.parentescoNombre || parentesco?.descripcion || "N/A";
    };

    // Calcular porcentaje total de beneficiarios
    const porcentajeTotal = beneficiarios.reduce(
        (sum, ben) => sum + (parseFloat(ben.porcentaje) || 0),
        0
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="py-4">
                        <img
                            src="/logo.png"
                            alt="Logo Mova"
                            className="h-10 w-auto object-contain"
                        />
                    </div>

                    {/* Título Principal */}
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle size={32} />
                            <h1 className="text-2xl font-bold">Verificar Información</h1>
                        </div>
                        <p className="text-indigo-100 text-sm">
                            Por favor, revise cuidadosamente toda la información antes de
                            confirmar el envío.
                        </p>
                    </div>

                    {/* DOMICILIO Y PERSONALES */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
                            <Home size={18} className="text-indigo-600" />
                            <h2 className="font-semibold text-slate-700 uppercase text-sm tracking-wider">
                                Domicilio y Personales
                            </h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Dirección</p>
                                <p className="font-medium text-slate-800">
                                    {formData.calle} #{formData.numExterior}
                                    {formData.numInterior && ` Int. ${formData.numInterior}`}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Código Postal</p>
                                <p className="font-medium text-slate-800">
                                    {formData.codigoPostal}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Colonia</p>
                                <p className="font-medium text-slate-800">
                                    {formData.colonia || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Ciudad</p>
                                <p className="font-medium text-slate-800">
                                    {formData.ciudad || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Municipio</p>
                                <p className="font-medium text-slate-800">
                                    {formData.municipio || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Estado</p>
                                <p className="font-medium text-slate-800">
                                    {formData.estado || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">RFC</p>
                                <p className="font-medium text-slate-800 uppercase">
                                    {formData.rfc || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">
                                    Correo Electrónico
                                </p>
                                <p className="font-medium text-slate-800">{formData.correo}</p>
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
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Empresa</p>
                                <p className="font-medium text-slate-800">
                                    {formData.empresa || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">
                                    Teléfono de Empresa
                                </p>
                                <p className="font-medium text-slate-800">
                                    {formData.telefonoEmpresa || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">
                                    Antigüedad Laboral
                                </p>
                                <p className="font-medium text-slate-800">
                                    {formData.antiguedadLaboral
                                        ? `${formData.antiguedadLaboral} año(s)`
                                        : "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">
                                    Ingresos Mensuales
                                </p>
                                <p className="font-medium text-slate-800">
                                    {formData.ingresosMensuales
                                        ? `$${parseFloat(formData.ingresosMensuales).toLocaleString(
                                            "es-MX"
                                        )}`
                                        : "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* REFERENCIAS */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
                            <Users size={18} className="text-indigo-600" />
                            <h2 className="font-semibold text-slate-700 uppercase text-sm tracking-wider">
                                Referencias ({referencias.length})
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            {referencias.map((ref, index) => (
                                <div
                                    key={ref.id}
                                    className="pb-4 last:pb-0 border-b last:border-0 border-slate-100"
                                >
                                    <p className="text-xs font-bold text-indigo-500 uppercase mb-3">
                                        Referencia {index + 1}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Nombre</p>
                                            <p className="font-medium text-slate-800">
                                                {ref.nombre} {ref.apellidoPaterno}{" "}
                                                {ref.apellidoMaterno}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Teléfono</p>
                                            <p className="font-medium text-slate-800">
                                                {ref.telefono || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Parentesco</p>
                                            <p className="font-medium text-slate-800">
                                                {obtenerNombreParentesco(ref.parentescoId)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* BENEFICIARIOS */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-indigo-600" />
                                <h2 className="font-semibold text-slate-700 uppercase text-sm tracking-wider">
                                    Beneficiarios ({beneficiarios.length})
                                </h2>
                            </div>
                            <span
                                className={`text-xs font-bold px-3 py-1 rounded-full ${porcentajeTotal === 100
                                    ? "bg-green-100 text-green-700"
                                    : "bg-orange-100 text-orange-700"
                                    }`}
                            >
                                Total: {porcentajeTotal}%
                            </span>
                        </div>
                        <div className="p-6 space-y-6">
                            {beneficiarios.map((ben, index) => (
                                <div
                                    key={ben.id}
                                    className="pb-4 last:pb-0 border-b last:border-0 border-slate-100"
                                >
                                    <p className="text-xs font-bold text-indigo-500 uppercase mb-3">
                                        Beneficiario {index + 1}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Nombre</p>
                                            <p className="font-medium text-slate-800">
                                                {ben.nombre} {ben.apellidoPaterno}{" "}
                                                {ben.apellidoMaterno}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Parentesco</p>
                                            <p className="font-medium text-slate-800">
                                                {obtenerNombreParentesco(ben.parentescoId)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">
                                                Fecha de Nacimiento
                                            </p>
                                            <p className="font-medium text-slate-800">
                                                {ben.fechaNacimiento || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Porcentaje</p>
                                            <p className="font-medium text-slate-800">
                                                {ben.porcentaje}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DATOS BANCARIOS */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
                            <Landmark size={18} className="text-indigo-600" />
                            <h2 className="font-semibold text-slate-700 uppercase text-sm tracking-wider">
                                Datos Bancarios
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Método de Cobro</p>
                                    <p className="font-medium text-slate-800">
                                        {formData.datosBancarios === "debito"
                                            ? "Con Tarjeta de Débito"
                                            : "Sin Tarjeta (Retiro en efectivo)"}
                                    </p>
                                </div>
                                {formData.datosBancarios === "debito" && (
                                    <>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">Banco</p>
                                            <p className="font-medium text-slate-800">
                                                {obtenerNombreBanco()}
                                            </p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-slate-500 mb-1">
                                                Número de Tarjeta
                                            </p>
                                            <p className="font-medium text-slate-800 font-mono tracking-wider">
                                                {formData.numeroTarjeta}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mensaje de advertencia */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="text-sm font-medium text-amber-800 mb-1">
                                Importante
                            </p>
                            <p className="text-xs text-amber-700">
                                Asegúrese de que todos los datos sean correctos antes de
                                confirmar. Una vez enviado, no podrá modificar esta información.
                            </p>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-end">
                        <button
                            onClick={onEditar}
                            disabled={cargando}
                            className="px-6 py-3 rounded-xl font-bold text-indigo-600 bg-white border-2 border-indigo-600 hover:bg-indigo-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Edit size={18} />
                            Editar información
                        </button>
                        <button
                            onClick={onConfirmar}
                            disabled={cargando}
                            className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${cargando
                                ? "bg-slate-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
                                }`}
                        >
                            {cargando ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Confirmar y enviar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}