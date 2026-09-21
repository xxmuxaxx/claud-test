import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from '@/router'

function renderLab() {
  const router = createMemoryRouter(routes, { initialEntries: ['/neural-network'] })
  render(<RouterProvider router={router} />)
  return router
}

const neurons = () => screen.getAllByRole('img', { name: /нейрон \d+:/ })
const metrics = () => within(screen.getByRole('group', { name: 'Метрики' }))
const epochText = () => metrics().getByText('Эпоха').parentElement
const status = () => screen.getByRole('status')
const button = (name: string) => screen.getByRole('button', { name })
const chartPoints = () =>
  screen
    .getByRole('img', { name: 'Ошибка по эпохам' })
    .querySelector('polyline')!
    .getAttribute('points')!
    .trim()
    .split(' ').length

// The starting weights come from Math.random: pin it so every run trains exactly the same way.
beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.42)
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('/neural-network', () => {
  it('opens from the navbar with the whole lab on the page', async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(routes, { initialEntries: ['/tasks'] })
    render(<RouterProvider router={router} />)

    await user.click(screen.getByRole('link', { name: 'Нейронная сеть' }))

    expect(router.state.location.pathname).toBe('/neural-network')
    expect(screen.getByRole('heading', { level: 1, name: 'Нейронная сеть' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Схема нейронной сети' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /граница решения/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Ошибка по эпохам' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Метрики' })).toBeInTheDocument()
    expect(screen.getByLabelText('Набор данных')).toHaveValue('xor')
  })

  it('starts ready: epoch 0, an untrained network, buttons for the first run', () => {
    renderLab()

    expect(status()).toHaveTextContent('Готово')
    expect(epochText()).toHaveTextContent('0 / 2000')
    expect(neurons()).toHaveLength(2 + 4 + 1) // input, one hidden layer of 4, output
    expect(button('Старт')).toBeEnabled()
    expect(button('Шаг')).toBeEnabled()
    expect(button('Пауза')).toBeDisabled()
    expect(chartPoints()).toBe(1)
  })

  describe('training', () => {
    it('Step runs one iteration: the epoch, the loss and the chart move', async () => {
      const user = userEvent.setup()
      renderLab()
      const lossBefore = metrics().getByText('Ошибка (loss)').nextSibling?.textContent

      await user.click(button('Шаг'))

      expect(epochText()).toHaveTextContent('2 / 2000') // the default step is 2 epochs
      expect(metrics().getByText('Ошибка (loss)').nextSibling?.textContent).not.toBe(lossBefore)
      expect(status()).toHaveTextContent('Пауза')
      expect(chartPoints()).toBe(2)
    })

    it('Start trains on its own, Pause stops it, Start resumes', () => {
      vi.useFakeTimers()
      renderLab()

      fireEvent.click(button('Старт'))
      expect(status()).toHaveTextContent('Обучение...')
      expect(button('Старт')).toBeDisabled()
      expect(button('Шаг')).toBeDisabled()

      act(() => void vi.advanceTimersByTime(1000))
      const running = Number(epochText()!.textContent!.match(/\d+/)![0])
      expect(running).toBeGreaterThan(20)
      expect(chartPoints()).toBeGreaterThan(10)

      fireEvent.click(button('Пауза'))
      expect(status()).toHaveTextContent('Пауза')
      act(() => void vi.advanceTimersByTime(1000))
      expect(epochText()).toHaveTextContent(`${running} / 2000`)

      fireEvent.click(button('Старт'))
      act(() => void vi.advanceTimersByTime(500))
      expect(Number(epochText()!.textContent!.match(/\d+/)![0])).toBeGreaterThan(running)
    })

    it('finishes after the chosen number of epochs and stops by itself', async () => {
      vi.useFakeTimers()
      renderLab()
      fireEvent.change(screen.getByLabelText('Всего эпох'), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText('Эпох за шаг'), { target: { value: '25' } })

      fireEvent.click(button('Старт'))
      act(() => void vi.advanceTimersByTime(1000))

      expect(epochText()).toHaveTextContent('100 / 100')
      expect(status()).toHaveTextContent('Обучение завершено')
      expect(button('Старт')).toBeDisabled()
      expect(button('Шаг')).toBeDisabled()
      expect(button('Пауза')).toBeDisabled()
    })

    it('learns XOR: the loss falls and all four rows come out right', async () => {
      const user = userEvent.setup()
      renderLab()
      const table = screen.getByRole('table', { name: 'Ответы сети на каждую строку' })
      const wrongBefore = within(table).queryAllByText('Нет').length
      fireEvent.change(screen.getByLabelText('Эпох за шаг'), { target: { value: '100' } })

      for (let i = 0; i < 6; i++) await user.click(button('Шаг'))

      const lossCell = metrics().getByText('Ошибка (loss)').nextSibling
      expect(Number(lossCell!.textContent!.replace(',', '.'))).toBeLessThan(0.05)
      expect(metrics().getByText('Точность').nextSibling).toHaveTextContent('100')
      expect(within(table).queryAllByText('Нет')).toHaveLength(0)
      expect(within(table).getAllByText('Да')).toHaveLength(4)
      expect(wrongBefore).toBeGreaterThan(0)
    })

    it('Reset brings back an untrained network at epoch 0', async () => {
      const user = userEvent.setup()
      renderLab()
      await user.click(button('Шаг'))
      await user.click(button('Шаг'))
      expect(epochText()).toHaveTextContent('4 / 2000')

      await user.click(button('Сброс'))

      expect(epochText()).toHaveTextContent('0 / 2000')
      expect(status()).toHaveTextContent('Готово')
      expect(chartPoints()).toBe(1)
    })

    it('Reset also stops a running training', () => {
      vi.useFakeTimers()
      renderLab()
      fireEvent.click(button('Старт'))
      act(() => void vi.advanceTimersByTime(300))

      fireEvent.click(button('Сброс'))
      act(() => void vi.advanceTimersByTime(300))

      expect(status()).toHaveTextContent('Готово')
      expect(epochText()).toHaveTextContent('0 / 2000')
    })
  })

  describe('settings', () => {
    it('adds and removes hidden layers, and the diagram follows', async () => {
      const user = userEvent.setup()
      renderLab()
      expect(screen.queryByText('Нейронов в слое 2')).not.toBeInTheDocument()

      await user.click(button('Увеличить: Скрытых слоёв'))
      expect(screen.getByText('Нейронов в слое 2')).toBeInTheDocument()
      expect(neurons()).toHaveLength(2 + 4 + 4 + 1)
      expect(screen.getByText('Скрытый 2')).toBeInTheDocument()

      await user.click(button('Уменьшить: Скрытых слоёв'))
      expect(neurons()).toHaveLength(2 + 4 + 1)
      expect(button('Уменьшить: Скрытых слоёв')).toBeDisabled() // at least one hidden layer
    })

    it('changes the number of neurons of one layer', async () => {
      const user = userEvent.setup()
      renderLab()

      await user.click(button('Увеличить: Нейронов в слое 1'))
      await user.click(button('Увеличить: Нейронов в слое 1'))
      expect(neurons()).toHaveLength(2 + 6 + 1)

      await user.click(button('Уменьшить: Нейронов в слое 1'))
      expect(neurons()).toHaveLength(2 + 5 + 1)
    })

    it('draws a connection for every pair of neurons in neighbouring layers', async () => {
      const user = userEvent.setup()
      renderLab()
      const connections = () =>
        screen.getByRole('group', { name: 'Схема нейронной сети' }).querySelectorAll('line')

      expect(connections()).toHaveLength(2 * 4 + 4 * 1)
      await user.click(button('Увеличить: Скрытых слоёв'))
      expect(connections()).toHaveLength(2 * 4 + 4 * 4 + 4 * 1)
    })

    it('creates a new network when the architecture, activation or dataset changes', async () => {
      const user = userEvent.setup()
      renderLab()

      await user.click(button('Шаг'))
      await user.click(button('Увеличить: Скрытых слоёв'))
      expect(epochText()).toHaveTextContent('0 / 2000')

      await user.click(button('Шаг'))
      await user.selectOptions(screen.getByLabelText('Функция активации'), 'ReLU')
      expect(epochText()).toHaveTextContent('0 / 2000')
      expect(screen.getByLabelText('Функция активации')).toHaveValue('relu')

      await user.click(button('Шаг'))
      await user.selectOptions(screen.getByLabelText('Набор данных'), 'AND')
      expect(epochText()).toHaveTextContent('0 / 2000')
      expect(status()).toHaveTextContent('Готово')
    })

    it('keeps the network when only the training settings change', async () => {
      const user = userEvent.setup()
      renderLab()
      await user.click(button('Шаг'))

      await user.selectOptions(screen.getByLabelText('Скорость обучения'), '0.5')
      await user.selectOptions(screen.getByLabelText('Эпох за шаг'), '10')

      expect(epochText()).toHaveTextContent('2 / 2000')
      expect(metrics().getByText('Скорость обучения').nextSibling).toHaveTextContent('0,5')
      await user.click(button('Шаг'))
      expect(epochText()).toHaveTextContent('12 / 2000') // the new step size is used at once
    })

    it('offers all four activation functions', () => {
      renderLab()
      const options = within(screen.getByLabelText('Функция активации')).getAllByRole('option')
      expect(options.map((option) => option.textContent)).toEqual([
        'Sigmoid',
        'ReLU',
        'Tanh',
        'Linear',
      ])
    })
  })

  describe('datasets', () => {
    it('shows a truth table for XOR, AND and OR', async () => {
      const user = userEvent.setup()
      renderLab()

      for (const name of ['XOR', 'AND', 'OR']) {
        await user.selectOptions(screen.getByLabelText('Набор данных'), name)
        const table = screen.getByRole('table', { name: 'Ответы сети на каждую строку' })
        expect(within(table).getAllByRole('row')).toHaveLength(1 + 4)
      }
    })

    it('shows scattered points for the plane datasets, and no table', async () => {
      const user = userEvent.setup()
      renderLab()

      await user.selectOptions(screen.getByLabelText('Набор данных'), 'Круг в кольце')

      expect(screen.queryByRole('table')).not.toBeInTheDocument()
      const plot = screen.getByRole('img', { name: /граница решения/i })
      expect(plot.querySelectorAll('circle')).toHaveLength(80 + 1) // the points and the selected one
    })

    it('shows the neuron values for the row chosen in the table', async () => {
      const user = userEvent.setup()
      renderLab()
      expect(screen.getByText(/для точки 0,00; 0,00/)).toBeInTheDocument()

      const table = screen.getByRole('table', { name: 'Ответы сети на каждую строку' })
      await user.click(within(table).getAllByRole('row')[3]) // 1 0

      expect(screen.getByText(/для точки 1,00; 0,00/)).toBeInTheDocument()
      const [x1] = screen.getAllByRole('img', { name: /Входной слой, нейрон 1/ })
      expect(x1).toHaveAccessibleName('Входной слой, нейрон 1: значение 1,00')
    })
  })

  describe('network diagram', () => {
    it('names every neuron with its value, and the hidden and output ones with the bias', () => {
      renderLab()

      expect(
        screen.getByRole('img', { name: /^Входной слой, нейрон 2: значение [\d,-]+$/ }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('img', {
          name: /^Скрытый слой 1, нейрон 4: значение [\d,-]+, смещение 0,00$/,
        }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('img', { name: /^Выходной слой, нейрон 1: значение [\d,-]+, смещение/ }),
      ).toBeInTheDocument()
    })

    it('updates the values and the weights as the network trains', async () => {
      const user = userEvent.setup()
      renderLab()
      const outputBefore = screen
        .getByRole('img', { name: /^Выходной слой/ })
        .getAttribute('aria-label')
      const svg = screen.getByRole('group', { name: 'Схема нейронной сети' })
      const weightsBefore = [...svg.querySelectorAll('line title')].map(
        (title) => title.textContent,
      )

      await user.click(button('Шаг'))

      expect(
        screen.getByRole('img', { name: /^Выходной слой/ }).getAttribute('aria-label'),
      ).not.toBe(outputBefore)
      const weightsAfter = [...svg.querySelectorAll('line title')].map((title) => title.textContent)
      expect(weightsAfter).not.toEqual(weightsBefore)
    })

    it('can hide the weight numbers', async () => {
      const user = userEvent.setup()
      renderLab()
      const svg = screen.getByRole('group', { name: 'Схема нейронной сети' })
      const labelled = svg.querySelectorAll('text').length

      await user.click(screen.getByLabelText('Показывать веса'))

      expect(svg.querySelectorAll('text').length).toBe(labelled - (2 * 4 + 4))
    })
  })
})
