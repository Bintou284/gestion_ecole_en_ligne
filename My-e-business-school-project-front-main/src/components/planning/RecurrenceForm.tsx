import {
  Box,
  Typography,
  Select,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Alert,
} from "@mui/material";
import type { FormData } from "../../types/planning.types";

interface RecurrenceFormProps {
  formData: FormData;
  onFormChange: (field: string, value: any) => void;
}

export default function RecurrenceForm({ formData, onFormChange }: RecurrenceFormProps) {
  return (
    <Box
      sx={{
        p: 2,
        backgroundColor: "#f0f4ff",
        borderRadius: 2,
        border: "2px dashed #667eea",
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Typography variant="subtitle2" fontWeight={700}>
           Récurrence
        </Typography>
      </Box>

      {/* Type de récurrence */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Type de récurrence</InputLabel>
        <Select
          value={formData.is_recurring ? formData.recurrence_type : "none"}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "none") {
              onFormChange("is_recurring", false);
            } else {
              onFormChange("is_recurring", true);
              onFormChange("recurrence_type", value);
            }
          }}
          label="Type de récurrence"
        >
          <MenuItem value="none">
            <em>Pas de récurrence (créneau unique)</em>
          </MenuItem>
          <MenuItem value="weekly">Chaque semaine</MenuItem>
          <MenuItem value="biweekly">Toutes les 2 semaines</MenuItem>
          <MenuItem value="triweekly">Toutes les 3 semaines</MenuItem>
          <MenuItem value="monthly">Chaque mois</MenuItem>
        </Select>
      </FormControl>

      {formData.is_recurring && (
        <>
          {/* Mode de récurrence mensuel */}
          {formData.recurrence_type === "monthly" && (
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Mode de répétition</InputLabel>
              <Select
                value={formData.recurrence_mode}
                onChange={(e) => onFormChange("recurrence_mode", e.target.value)}
                label="Mode de répétition"
              >
                <MenuItem value="day">
                   Par jour de semaine (ex: chaque lundi)
                </MenuItem>
                <MenuItem value="date">
                   Par date du mois (ex: le 31 de chaque mois)
                </MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Nombre de répétitions */}
          <TextField
            label="Nombre de répétitions"
            type="number"
            value={formData.recurrence_count}
            onChange={(e) =>
              onFormChange("recurrence_count", Math.max(1, parseInt(e.target.value) || 1))
            }
            fullWidth
            size="small"
            InputProps={{
              inputProps: { min: 1, max: 52 },
            }}
            helperText={`Créera ${formData.recurrence_count} créneaux au total`}
          />

          {/* Aperçu de la récurrence */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption">
              <strong>Aperçu :</strong>{" "}
              {formData.recurrence_type === "weekly" && "Chaque semaine"}
              {formData.recurrence_type === "biweekly" && "Toutes les 2 semaines"}
              {formData.recurrence_type === "triweekly" && "Toutes les 3 semaines"}
              {formData.recurrence_type === "monthly" &&
                formData.recurrence_mode === "day" &&
                `Chaque mois le même jour (${
                  ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"][
                    new Date(formData.date).getDay()
                  ]
                })`}
              {formData.recurrence_type === "monthly" &&
                formData.recurrence_mode === "date" &&
                `Chaque mois le ${new Date(formData.date).getDate()}`}
              {" "}pendant {formData.recurrence_count} fois.
            </Typography>
          </Alert>
        </>
      )}
    </Box>
  );
}