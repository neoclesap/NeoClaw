import re
import sys
import json

def analyze_document(text):
    """
    Analisa o texto de um documento jurídico em busca de termos e cláusulas críticas.
    """
    
    findings = {
        "fines": [],
        "auto_renewal": [],
        "data_collection": [],
        "risk_indicators": []
    }
    
    # Padrões para Multas
    fine_patterns = [
        r"(?i)multa",
        r"(?i)penalidade",
        r"(?i)cláusula penal",
        r"(?i)indenização"
    ]
    
    # Padrões para Renovação Automática
    renewal_patterns = [
        r"(?i)renovação automática",
        r"(?i)renovado automaticamente",
        r"(?i)prorrogação automática",
        r"(?i)prazo indeterminado"
    ]
    
    # Padrões para Coleta de Dados
    data_patterns = [
        r"(?i)dados pessoais",
        r"(?i)coleta",
        r"(?i)compartilhamento",
        r"(?i)privacidade",
        r"(?i)cookies"
    ]
    
    lines = text.split('\n')
    for i, line in enumerate(lines):
        # Busca multas
        for pattern in fine_patterns:
            if re.search(pattern, line):
                findings["fines"].append({"line": i + 1, "content": line.strip()})
                break
        
        # Busca renovação
        for pattern in renewal_patterns:
            if re.search(pattern, line):
                findings["auto_renewal"].append({"line": i + 1, "content": line.strip()})
                break
                
        # Busca dados
        for pattern in data_patterns:
            if re.search(pattern, line):
                findings["data_collection"].append({"line": i + 1, "content": line.strip()})
                break
                
    return findings

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python analyze_document.py <arquivo_texto>")
        sys.exit(1)
        
    try:
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            content = f.read()
            results = analyze_document(content)
            print(json.dumps(results, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Erro ao processar: {e}")
