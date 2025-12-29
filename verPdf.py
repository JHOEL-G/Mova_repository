import fitz  # PyMuPDF
import json

def generar_contrato_profesional(datos_json, plantilla_path, output_path):
    """
    Genera un PDF profesional reemplazando placeholders
    """
    doc = fitz.open(plantilla_path)
    
    # Mapeo de placeholders → valores del JSON
    datos = json.loads(datos_json) if isinstance(datos_json, str) else datos_json
    pagare = datos['data']['pagare']
    poliza = datos['data']['poliza']
    caratula = datos['data']['caratula']
    
    reemplazos = {
        # Pagaré
        "{IMPORTE formato moneda, 2 decimales}, {(IMPORTE con letra Pesos 99/100 M.N.)}": pagare.get('importe', ''),
        "{FECHA DE SUSCRIPCIÓN}": pagare.get('fecha', ''),
        "{CANTIDAD EN NUMERO DE % TASA DE INTERÉS}": pagare.get('tasaInteres', ''),
        "{DD de MM del AAAA}": pagare.get('fechaVencimiento', ''),
        "{FECHA GENERACION DEL DOCUMENTO DD de MMM de AAAA}": pagare.get('fechaGeneracionDoc', ''),
        "{NOMBRE COMPLETO DE SOCIO MOVA}": pagare.get('firmas', {}).get('socioNombre', ''),
        "{DIRECCIÓN COMPLETA DE SOCIO MOVA}": pagare.get('firmas', {}).get('socioDireccion', ''),
        "{NOMBRE COMPLETO DEL AVAL DE SOCIO MOVA}": pagare.get('firmas', {}).get('aval1Nombre', ''),
        "{DIRECCIÓN COMPLETA DEL AVAL DE SOCIO MOVA}": pagare.get('firmas', {}).get('aval1Direccion', ''),
        
        # Póliza
        "{NOMBRE COMPLETO DE LA SOCIA MOVA}": poliza.get('nombre', ''),
        "{NOMBRE DEL PRODUCTO FINANCIERO}": poliza.get('producto', ''),
        "{GENERO}": poliza.get('genero', ''),
        "{FECHA DE NACIMIENTO}": poliza.get('fechaNacimiento', ''),
        "{ESTADO DE NACIMIENTO}": poliza.get('estadoNacimiento', ''),
        "{NACIONALIDAD}": poliza.get('nacionalidad', ''),
        "{DOMICILIO COMPLETO (CALLE, # EXTERNO, # INTERNO}": poliza.get('direccion', ''),
        "{NOMBRE COLONIA}": poliza.get('colonia', ''),
        "{NOMBRE DEL MUNICIPIO}": poliza.get('municipio', ''),
        "{NOMBRE DE CIUDAD}": poliza.get('ciudad', ''),
        "{ESTADO}": poliza.get('estado', ''),
        "{CODIGO POSTAL}": poliza.get('codigoPostal', ''),
        "{FECHA DE ACTIVACIÓN DE LA LÍNEA DE CRÉDITO}": poliza.get('fechaContratacion', ''),
        "{SUMA ASEGURADA}": poliza.get('sumaAsegurada', ''),
        "{NOMBRE DEL BENEFICIARIO}": poliza.get('beneficiario', ''),
        "{PARENTESCO DEL BENEFICIARIO}": poliza.get('parentesco', ''),
        "{% ASIGNADO AL BENEFICIARIO}": poliza.get('porcentaje', ''),
        "{EDAD DEL BENEFICIARIO}": poliza.get('edad', ''),
        "{SIN COSTO}": poliza.get('costo', ''),
        "{NOMBRE COMPLETO DEL GERENTE DE SUCURSAL}": poliza.get('gerenteNombre', ''),
        
        # Carátula
        "{Nombre completo de socia mova}": caratula.get('clienteNombre', ''),
        "{COMISION ORDEN DE PAGO SIN IVA)": caratula.get('comisionOrdenPago', ''),
        "{MONTO COMISION DE LA FIRMA DIGITAL SIN IVA)": caratula.get('comisionFirmaDigital', ''),
        "{NÚMERO DE CRÉDITO)": caratula.get('creditoNumero', ''),
        "{Frecuencia de la línea de crédito)": caratula.get('frecuencia', ''),
        "{NUMERO DE LÍNEA DE CRÉDITO}": caratula.get('lineaCreditoNumero', ''),
        "({% tasa de interés sin iva}) ({% tasa de interés sin iva con letra})": caratula.get('tasaInteres', ''),
        "({% tasa de interés mas iva}) ({% tasa de interés mas iva con letra})": caratula.get('tasaInteresIva', ''),
        "{% tasa moratorios} ({en letra la tasa de moratorios})": caratula.get('tasaMoratorios', ''),
        "{CURP DEL AVAL}": caratula.get('curp', ''),
        "{179.4% (ciento setenta y nueve punto cuatro por ciento)}": caratula.get('cat', ''),
        "{DOMICILIO DEL AVAL (Calle, numero externo, numero interno, Colonia)}": caratula.get('avalDomicilio1', ''),
        "{Código postal del domicilio del aval} {Ciudad y Estado}": caratula.get('avalDomicilio2', ''),
        "{nombre completo del aval de propiedad}": caratula.get('avalPropiedadNombre', ''),
        "{nombre completo del aval de montos}": caratula.get('avalMontoNombre', ''),
    }
    
    # Guardar posiciones ANTES de borrar
    posiciones = {}
    for page_num in range(len(doc)):
        page = doc[page_num]
        for placeholder in reemplazos.keys():
            text_instances = page.search_for(placeholder)
            if text_instances:
                posiciones[placeholder] = {
                    'page': page_num,
                    'rects': text_instances
                }
    
    # Borrar placeholders
    for page_num in range(len(doc)):
        page = doc[page_num]
        for placeholder in reemplazos.keys():
            text_instances = page.search_for(placeholder)
            for rect in text_instances:
                page.add_redact_annot(rect, fill=(1, 1, 1))
        page.apply_redactions()
    
    # Escribir nuevos valores
    for placeholder, valor in reemplazos.items():
        if placeholder in posiciones and valor:
            page_num = posiciones[placeholder]['page']
            page = doc[page_num]
            rect = posiciones[placeholder]['rects'][0]  # Tomar la primera ocurrencia
            
            page.insert_textbox(
                rect,
                valor,
                fontsize=9,
                fontname="helv",
                color=(0, 0, 0),
                align=0
            )
    
    # Guardar el PDF
    doc.save(output_path, garbage=4, deflate=True, clean=True)
    doc.close()
    
    return output_path


# PRUEBA DEL SCRIPT
if __name__ == "__main__":
    # Datos de prueba (copia tu JSON aquí)
    datos_prueba = {
        "data": {
            "certificar": 0,
            "poliza": {
                "nombre": "María González López",
                "producto": "Crédito Personal UNIMEX",
                "genero": "Femenino",
                "fechaNacimiento": "10/05/1985",
                "estadoNacimiento": "Coahuila",
                "nacionalidad": "Mexicana",
                "direccion": "Av. Reforma 123, Col. Centro",
                "colonia": "Centro",
                "municipio": "Torreón",
                "ciudad": "Torreón",
                "estado": "Coahuila",
                "codigoPostal": "27000",
                "fechaContratacion": "15 de Enero de 2025",
                "sumaAsegurada": "$50,000.00",
                "beneficiario": "Carlos González",
                "parentesco": "Esposo",
                "porcentaje": "100%",
                "edad": "42",
                "costo": "Sin costo",
                "gerenteNombre": "Lic. Roberto Martínez"
            },
            "pagare": {
                "importe": "$50,000.00 MXN (Cincuenta mil pesos 00/100 M.N.)",
                "fecha": "15 de Enero de 2025",
                "tasaInteres": "3.5% mensual fija más IVA",
                "fechaVencimiento": "15 de Julio de 2025",
                "fechaGeneracionDoc": "15 de Enero de 2025",
                "firmas": {
                    "socioNombre": "María González López",
                    "socioDireccion": "Av. Reforma 123, Col. Centro",
                    "aval1Nombre": "Juan Pérez Martínez",
                    "aval1Direccion": "Calle Juárez 456, Col. Norte"
                }
            },
            "caratula": {
                "producto": "Crédito Personal UNIMEX",
                "clienteNombre": "María González López",
                "comisionFirmaDigital": "$150.00",
                "comisionOrdenPago": "$50.00",
                "creditoNumero": "CRED-2025-001234",
                "frecuencia": "Mensual",
                "lineaCreditoNumero": "LC-2025-001234",
                "tasaInteres": "3.5% mensual",
                "tasaInteresIva": "4.06% mensual",
                "tasaMoratorios": "2",
                "curp": "GOLM850510HCSNPR03",
                "cat": "179.4%",
                "avalDomicilio1": "Calle Juárez 456",
                "avalDomicilio2": "27001 Torreón",
                "avalPropiedadNombre": "Juan Pérez",
                "avalMontoNombre": "Ana Rodríguez"
            }
        }
    }
    
    # Generar PDF
    plantilla = r"C:\fullstack\NOVA\noVa\public\CONTRATO-22.pdf"
    output = r"C:\fullstack\NOVA\noVa\CONTRATO_GENERADO.pdf"
    
    resultado = generar_contrato_profesional(datos_prueba, plantilla, output)
    print(f"✅ PDF generado exitosamente: {resultado}")