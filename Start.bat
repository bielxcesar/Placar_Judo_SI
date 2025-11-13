@echo off
setlocal EnableDelayedExpansion
title Iniciando servidor Spring Boot...

:: Detecta o caminho do diretório onde o .bat está
set "SCRIPT_DIR=%~dp0"

:: Localiza o .jar correto dentro da pasta target (ignora .original)
for %%f in ("%SCRIPT_DIR%Placar-Judo\target\Placar-Judo-*.jar") do (    echo Verificando: %%~nxf
    echo %%~nxf | find /i ".original" >nul
    if errorlevel 1 (
        echo JAR localizado em: %%f

        :: Cria um .bat temporário para executar o JAR
        echo java -jar "%%f" > "%SCRIPT_DIR%run_temp.bat"

        :: Executa o .bat em nova janela
        start "" "%SCRIPT_DIR%run_temp.bat"

        :: Aguarda 8 segundos para o servidor subir
        timeout /t 8 /nobreak >nul

        :: Abre as páginas no navegador
        start "" "http://localhost:8080/exibicao.html"
        start "" "http://localhost:8080/controle.html"

        goto :done
    )
)

echo ERRO: Nenhum arquivo JAR válido encontrado.
pause
exit /b

:done
pause
