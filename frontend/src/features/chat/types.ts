export type Message = {
  role: "user" | "bot"
  text: string
  timestamp: Date
  isTyping?: boolean
  displayedText?: string
}

export const ALL_PROVINCES = [
  "Jujuy",
  "La Nación Argentina",
  "La Rioja",
  "La Provincia Del Chubut",
  "Entre Rios",
  "Corrientes",
  "Neuquen",
  "Tucumán",
  "Santiago Del Estero",
  "Formosa",
  "Cordoba",
  "Santa Cruz",
  "Buenos Aires",
  "La Pampa",
  "La Provincia Del Chaco",
  "Tierra Del Fuego Antártida E Islas Del Atlántico Sur",
  "Rio Negro",
  "Catamarca",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Fe",
  "Misiones",
  "Mendoza",
]
