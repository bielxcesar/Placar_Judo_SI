package com.example.Placar.Judo;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Controller
public class PlacarController {

    private int scoreA = 0;
    private int scoreB = 0;

    // Redireciona da raiz para exibicao.html
    @GetMapping("/")
    public String redirecionarParaExibicao() {
        return "redirect:/exibicao.html";
    }
    @GetMapping("/controle")
    public String mostrarControle() {
        return "redirect:/controle.html";
    }

    // Retorna o placar atual como JSON
    @ResponseBody
    @GetMapping("/placar")
    public Map<String, Integer> getPlacar() {
        return Map.of("timeA", scoreA, "timeB", scoreB);
    }

    // Incrementa o placar
    @ResponseBody
    @PostMapping("/placar/increment")
    public void increment(@RequestParam String team) {
        if ("A".equals(team)) scoreA++;
        else if ("B".equals(team)) scoreB++;
    }

    // Decrementa o placar
    @ResponseBody
    @PostMapping("/placar/decrement")
    public void decrement(@RequestParam String team) {
        if ("A".equals(team) && scoreA > 0) scoreA--;
        else if ("B".equals(team) && scoreB > 0) scoreB--;
    }
}
