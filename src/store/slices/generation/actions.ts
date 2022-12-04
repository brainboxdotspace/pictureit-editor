import { Editor, nonRenderableLayerTypes } from "@layerhub-io/core"
import ObjectExporter from "@layerhub-io/core/src/utils/object-exporter"
import { createAction, createAsyncThunk } from "@reduxjs/toolkit"
import { fabric } from "fabric"
import api from "../../../api"
import { extractErrorMessage } from "../../../api/utils"
import { RemoteData } from "../../../interfaces/common"
import { addGaussianNoise } from "../../../utils/noise"

export const setGenerationRequest = createAction<{ id: string; state: RemoteData<{ image: string }> }>(
  "generation/setGeneratingState"
)

export const renderInitImage = async (
  editor: Editor,
  generationFrame: fabric.GenerationFrame
): Promise<string | undefined> => {
  const frame = editor.frame.options
  const objectExporter = new ObjectExporter()
  const exported = objectExporter.export(generationFrame.toObject(), frame) as IGenerationFrame
  exported.objects = exported.objects?.filter(
    (object: ILayer) => !object.id.match(/-background$/) && !nonRenderableLayerTypes.includes(object.type)
  )

  if (exported.objects?.length == 0) return

  const canvas = await editor.renderer.renderCanvas({
    id: "",
    frame: { width: 512, height: 512 },
    layers: [exported],
    metadata: {},
  })
  addGaussianNoise(canvas.getContext("2d")!, 2)
  return canvas.toDataURL("image/jpeg")
}

export const generateImage = createAsyncThunk<
  void,
  { id: string; frame: fabric.GenerationFrame; prompt: string; editor: Editor },
  { rejectValue: Record<string, string[]> }
>("generation/generateImage", async ({ id, frame, prompt, editor }, { rejectWithValue, dispatch }) => {
  try {
    dispatch(setGenerationRequest({ id, state: { state: "LOADING" } }))

    frame.showLoading(9000)

    const init_image = await renderInitImage(editor, frame)

    api
      .stableDiffusion({
        prompt: prompt,
        guidance_scale: 7.5,
        prompt_strength: 0.8,
        ...(init_image ? { init_image: init_image, prompt_strength: 0.9 } : {}),
      })
      .then(async (result) => {
        if (result.url) {
          await frame.setImage(result.url)
          editor.objects.afterAddHook(frame as fabric.Object, false)

          dispatch(setGenerationRequest({ id, state: { state: "SUCCESS", data: { image: result.url } } }))
        }
      })
      .catch(async (error) => {
        dispatch(setGenerationRequest({ id, state: { state: "ERROR" } }))
        frame.showError(await extractErrorMessage(error))
        editor.objects.afterAddHook(frame as fabric.Object, false)
      })
  } catch (err) {
    return rejectWithValue((err as any).response?.data?.error.data || null)
  }
})
